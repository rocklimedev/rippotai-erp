import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { HttpSecurityTelemetryService } from './http-security-telemetry.service';
import {
  authTracker,
  configuredPositiveInteger,
} from './auth-throttle.decorator';

describe('Security telemetry and alerts', () => {
  let service: HttpSecurityTelemetryService;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  let log: jest.SpyInstance;
  let fetchSpy: jest.SpyInstance;
  const keys = [
    'SECURITY_ALERT_FAILURES',
    'SECURITY_METRICS_WINDOW_MS',
    'SECURITY_ALERT_COOLDOWN_MS',
    'SECURITY_ALERT_WEBHOOK_URL',
  ];
  let previous: Map<string, string | undefined>;
  beforeEach(() => {
    previous = new Map(keys.map((key) => [key, process.env[key]]));
    process.env.SECURITY_ALERT_FAILURES = '2';
    process.env.SECURITY_METRICS_WINDOW_MS = '1000';
    process.env.SECURITY_ALERT_COOLDOWN_MS = '10000';
    process.env.SECURITY_ALERT_WEBHOOK_URL =
      'https://alerts.example.test/security';
    jest.useFakeTimers();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
    service = new HttpSecurityTelemetryService();
  });
  afterEach(() => {
    service.onModuleDestroy();
    jest.restoreAllMocks();
    jest.useRealTimers();
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function response(statusCode: number) {
    const req: any = {
      method: 'POST',
      route: { path: '/api/v1/auth/reset-password' },
      ip: '192.0.2.99',
      headers: { authorization: 'Bearer private-session-token' },
      body: {
        token: 'private-reset-token',
        password: 'private-password',
        email: 'private@example.test',
      },
      url: '/auth/reset-password?token=private-query-token',
    };
    const res: any = new EventEmitter();
    res.statusCode = statusCode;
    service.observe(req, res);
    res.emit('finish');
  }

  it('logs a bounded failure summary and a deduplicated alert without credentials or personal data', async () => {
    response(401);
    response(401);
    response(429);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://alerts.example.test/security',
      expect.objectContaining({ method: 'POST', redirect: 'error' }),
    );
    const alert = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(alert).toMatchObject({
      event: 'security.failure_burst',
      failures: 2,
      threshold: 2,
    });
    jest.advanceTimersByTime(1000);
    const allOutput = JSON.stringify([
      ...warn.mock.calls,
      ...error.mock.calls,
      ...log.mock.calls,
      alert,
    ]);
    expect(allOutput).not.toMatch(/private-|private@example|192\.0\.2/);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      event: 'security.traffic_window',
      requests: 3,
      failures: 3,
      throttled: 1,
      maxRequestsPerIp: 3,
      maxRequestsPerTracker: 3,
    });
    response(401);
    response(401);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('records normal traffic without alerting and distinguishes security denials from server errors', () => {
    response(200);
    response(201);
    response(500);
    response(401);
    jest.advanceTimersByTime(1000);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      requests: 4,
      successes: 2,
      failures: 2,
    });
  });

  it('does not make a failing alert sink block request completion', async () => {
    fetchSpy.mockRejectedValue(new Error('private-webhook-secret'));
    response(401);
    response(401);
    await Promise.resolve();
    await Promise.resolve();
    expect(error.mock.calls.map((call) => JSON.parse(call[0]).event)).toContain(
      'security.alert_delivery_failed',
    );
    expect(JSON.stringify(error.mock.calls)).not.toContain(
      'private-webhook-secret',
    );
  });

  it('uses only trusted IP and normalized account/session identifiers for rate tracking', () => {
    const req = {
      ip: '127.0.0.1',
      body: { email: 'user@example.test' },
      headers: {},
    };
    expect(authTracker(req)).toBe(
      authTracker({
        ...req,
        body: { email: ' USER@example.test ' },
        headers: { 'x-forwarded-for': 'other' },
      }),
    );
    expect(authTracker(req)).not.toBe(
      authTracker({ ...req, body: { email: 'other@example.test' } }),
    );
    expect(authTracker(req)).not.toBe(authTracker({ ...req, ip: 'different' }));
  });

  it('rejects invalid configured thresholds', () => {
    for (const value of ['0', '-1', '1.5', 'invalid']) {
      process.env.SECURITY_ALERT_FAILURES = value;
      expect(() =>
        configuredPositiveInteger('SECURITY_ALERT_FAILURES', 10),
      ).toThrow('positive integer');
    }
  });

  it('bounds telemetry cardinality and flags windows unsuitable for threshold tuning', () => {
    for (let index = 0; index < 5001; index++) {
      const req: any = {
        method: 'GET',
        route: { path: '/health/live' },
        ip: `source-${index}`,
        headers: {},
      };
      const res: any = new EventEmitter();
      res.statusCode = 200;
      service.observe(req, res);
      res.emit('finish');
    }
    jest.advanceTimersByTime(1000);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      requests: 5001,
      trackingTruncated: true,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

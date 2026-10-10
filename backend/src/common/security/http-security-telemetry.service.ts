import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import {
  configuredPositiveInteger,
  authTracker,
} from './auth-throttle.decorator';

interface Traffic {
  requests: number;
  successes: number;
  failures: number;
  throttled: number;
  denied: number;
  maxDurationMs: number;
  clients: Map<string, number>;
  trackers: Map<string, number>;
  alerted: boolean;
}

@Injectable()
export class HttpSecurityTelemetryService implements OnModuleDestroy {
  private readonly logger = new Logger(HttpSecurityTelemetryService.name);
  private readonly secret = randomBytes(32);
  private readonly traffic = new Map<string, Traffic>();
  private windowStart = Date.now();
  private trackedKeys = 0;
  private trackingTruncated = false;
  private readonly cooldowns = new Map<string, number>();
  private readonly windowMs = configuredPositiveInteger(
    'SECURITY_METRICS_WINDOW_MS',
    60_000,
  );
  private readonly alertFailures = configuredPositiveInteger(
    'SECURITY_ALERT_FAILURES',
    10,
  );
  private readonly cooldownMs = configuredPositiveInteger(
    'SECURITY_ALERT_COOLDOWN_MS',
    300_000,
  );
  private readonly webhook = process.env.SECURITY_ALERT_WEBHOOK_URL;
  private readonly timer: ReturnType<typeof setInterval>;

  constructor() {
    if (this.webhook) {
      const url = new URL(this.webhook);
      if (
        !['http:', 'https:'].includes(url.protocol) ||
        url.username ||
        url.password
      ) {
        throw new Error(
          'SECURITY_ALERT_WEBHOOK_URL must be an HTTP(S) URL without embedded credentials',
        );
      }
    }
    this.timer = setInterval(() => this.flush(), this.windowMs);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
    this.flush();
  }

  observe(req: Request, res: Response) {
    const start = Date.now();
    const source = createHmac('sha256', this.secret)
      .update(req.ip ?? 'unknown')
      .digest('hex');
    res.once('finish', () => {
      // Route templates contain no raw client tokens or query strings.
      const path =
        typeof req.route?.path === 'string' ? req.route.path : 'unmatched';
      const route = `${req.method} ${path}`;
      if (this.traffic.size >= 1000 && !this.traffic.has(route)) return;
      const data = this.traffic.get(route) ?? {
        requests: 0,
        successes: 0,
        failures: 0,
        denied: 0,
        throttled: 0,
        maxDurationMs: 0,
        clients: new Map(),
        trackers: new Map(),
        alerted: false,
      };
      this.traffic.set(route, data);
      data.requests++;
      if (res.statusCode < 400) data.successes++;
      else data.failures++;
      if (res.statusCode === 429) data.throttled++;
      data.maxDurationMs = Math.max(data.maxDurationMs, Date.now() - start);
      this.increment(data.clients, source);
      this.increment(data.trackers, authTracker(req));
      const authRoute = /\/(?:auth)(?:\/|$)/.test(path);
      const securityFailure =
        [401, 403, 429].includes(res.statusCode) ||
        (authRoute && res.statusCode >= 400 && res.statusCode < 500);
      if (!securityFailure) return;
      data.denied++;
      // One warning per route/window, followed by totals and a burst alert.
      if (data.denied === 1)
        this.logger.warn(
          JSON.stringify({
            event: 'security.request_denied',
            route,
            status: res.statusCode,
          }),
        );
      if (
        !data.alerted &&
        data.denied >= this.alertFailures &&
        (this.cooldowns.get(route) ?? 0) <= Date.now()
      ) {
        data.alerted = true;
        this.cooldowns.set(route, Date.now() + this.cooldownMs);
        const alert = {
          event: 'security.failure_burst',
          route,
          failures: data.denied,
          throttled: data.throttled,
          windowMs: this.windowMs,
          threshold: this.alertFailures,
        };
        this.logger.error(JSON.stringify(alert));
        if (this.webhook) void this.deliverAlert(alert);
      }
    });
  }

  private increment(map: Map<string, number>, key: string) {
    if (map.has(key)) map.set(key, map.get(key)! + 1);
    else if (this.trackedKeys < 10000) {
      map.set(key, 1);
      this.trackedKeys++;
    } else this.trackingTruncated = true;
  }

  private async deliverAlert(alert: object) {
    try {
      const response = await fetch(this.webhook!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert),
        signal: AbortSignal.timeout(2000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Alert delivery rejected');
    } catch {
      this.logger.error(
        JSON.stringify({ event: 'security.alert_delivery_failed' }),
      );
    }
  }

  private flush() {
    const windowEnd = Date.now();
    for (const [route, data] of this.traffic)
      this.logger.log(
        JSON.stringify({
          event: 'security.traffic_window',
          windowStartedAt: new Date(this.windowStart).toISOString(),
          windowEndedAt: new Date(windowEnd).toISOString(),
          observedWindowMs: windowEnd - this.windowStart,
          trackingTruncated: this.trackingTruncated,
          route,
          windowMs: this.windowMs,
          requests: data.requests,
          successes: data.successes,
          failures: data.failures,
          throttled: data.throttled,
          maxDurationMs: data.maxDurationMs,
          maxRequestsPerIp: Math.max(0, ...data.clients.values()),
          maxRequestsPerTracker: Math.max(0, ...data.trackers.values()),
        }),
      );
    this.traffic.clear();
    this.windowStart = windowEnd;
    this.trackedKeys = 0;
    this.trackingTruncated = false;
    for (const [route, until] of this.cooldowns)
      if (until <= Date.now()) this.cooldowns.delete(route);
  }
}

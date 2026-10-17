import { IoAdapter } from '@nestjs/platform-socket.io';
import { GATEWAY_OPTIONS } from '@nestjs/websockets/constants';
import { RedisIoAdapter } from '../../redis-io.adapter';
import { NotificationsGateway } from '../gateway/notification.gateway';
import { getCorsOptions } from './cors.config';

describe('Shared CORS policy', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the shared policy for the development gateway', () => {
    const options = Reflect.getMetadata(GATEWAY_OPTIONS, NotificationsGateway);
    expect(options.cors).toEqual(getCorsOptions());
    expect(options.cors.origin).not.toContain('*');
    expect(options.cors.credentials).toBe(true);
  });

  it('prevents gateway options from overriding the Redis origin policy', () => {
    const createServer = jest
      .spyOn(IoAdapter.prototype, 'createIOServer')
      .mockReturnValue({});
    const adapter = new RedisIoAdapter({} as never);
    adapter.createIOServer(5000, { cors: { origin: '*' } } as never);
    expect(createServer).toHaveBeenCalledWith(5000, {
      cors: getCorsOptions(),
    });
  });
});

import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class SecurityRedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private connecting?: Promise<void>;
  constructor(config: ConfigService) {
    const options = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      commandTimeout: 500,
      connectTimeout: 500,
    };
    this.client = config.get<string>('REDIS_URL')
      ? new Redis(config.get<string>('REDIS_URL')!, options)
      : new Redis({
          ...options,
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: Number(config.get('REDIS_PORT') || 6379),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
          db: Number(config.get('REDIS_DB') || 0),
        });
    this.client.on('error', () => {}); // Requests return a generic 503, never connection credentials.
  }
  async run(script: string, keys: string[], args: (string | number)[]) {
    try {
      if (this.client.status === 'wait') {
        this.connecting ??= this.client.connect();
        await this.connecting;
      } else if (this.connecting && this.client.status === 'connecting')
        await this.connecting;
      if (this.client.status !== 'ready') throw new Error('Redis unavailable');
      return await this.client.eval(script, keys.length, ...keys, ...args);
    } catch {
      throw new ServiceUnavailableException(
        'Security checks temporarily unavailable. Retry shortly.',
      );
    } finally {
      if (this.client.status !== 'connecting') this.connecting = undefined;
    }
  }
  onModuleDestroy() {
    this.client.disconnect();
  }
}

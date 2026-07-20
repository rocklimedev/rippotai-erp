import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication } from '@nestjs/common';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(private readonly app: INestApplication) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT || 6379);

    const pubClient = new Redis({
      host,
      port,
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });

    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      console.error('❌ Redis Publisher Error:', err);
    });

    subClient.on('error', (err) => {
      console.error('❌ Redis Subscriber Error:', err);
    });

    // Wait until both clients are ready
    await Promise.all([
      new Promise<void>((resolve) => {
        if (pubClient.status === 'ready') return resolve();
        pubClient.once('ready', () => resolve());
      }),
      new Promise<void>((resolve) => {
        if (subClient.status === 'ready') return resolve();
        subClient.once('ready', () => resolve());
      }),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);

    console.log(`✅ Redis Socket.IO Adapter connected (${host}:${port})`);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      cors: {
        origin: [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:3001',
          'https://vendors-quote.rippotaiarchitecture.com',
          'https://rippotai-erp-qga2.vercel.app',
          'https://inos.rippotaiarchitecture.com',
        ],
        credentials: true,
      },
      ...options,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}

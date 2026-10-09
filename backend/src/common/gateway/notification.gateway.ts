import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AuthService } from '@/modules/auth/auth.service';
import { NotificationPayload } from '../interfaces/notification-payload.interfaces';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  constructor(private readonly moduleRef: ModuleRef) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || !token) throw new Error('Missing token');
      const auth = this.moduleRef.get(AuthService, { strict: false });
      const user = await auth.getCurrentUser(token);
      if (!user?.id) throw new Error('Invalid user');
      await client.join(this.roomName(user.id));
    } catch {
      this.logger.warn(
        `Rejected unauthenticated notification connection (${client.id})`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected (${client.id})`);
    // socket.io removes the client from all rooms automatically on disconnect
  }

  emitToUser(userId: string, notification: NotificationPayload) {
    this.server?.to(this.roomName(userId)).emit('notification', notification);
  }

  emitToUsers(userIds: string[], notification: NotificationPayload) {
    this.server
      ?.to(userIds.map((id) => this.roomName(id)))
      .emit('notification', notification);
  }

  private roomName(userId: string): string {
    return `user:${userId}`;
  }
}

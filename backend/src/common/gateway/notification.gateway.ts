import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
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

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId;

    if (!userId) {
      this.logger.warn(`Rejected connection with no userId (${client.id})`);
      client.disconnect(true);
      return;
    }

    client.join(this.roomName(userId));
    this.logger.debug(`User ${userId} connected via ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected (${client.id})`);
    // socket.io removes the client from all rooms automatically on disconnect
  }

  emitToUser(userId: string, notification: NotificationPayload) {
    this.server.to(this.roomName(userId)).emit('notification', notification);
  }

  emitToUsers(userIds: string[], notification: NotificationPayload) {
    this.server
      .to(userIds.map((id) => this.roomName(id)))
      .emit('notification', notification);
  }

  private roomName(userId: string): string {
    return `user:${userId}`;
  }
}

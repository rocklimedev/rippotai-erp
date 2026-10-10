import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private owner(userId: string, request: any) {
    if (request.user.id !== userId)
      throw new ForbiddenException('Notifications belong to another user');
    return userId;
  }

  @RequirePermission('notifications:read')
  @Get('user/:userId')
  findAllForUser(
    @Param('userId') userId: string,
    @Req() request: any,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAllForUser(
      this.owner(userId, request),
      unreadOnly === 'true',
    );
  }

  @RequirePermission('notifications:read')
  @Get('user/:userId/unread-count')
  unreadCount(@Param('userId') userId: string, @Req() request: any) {
    return this.notificationsService.getUnreadCount(
      this.owner(userId, request),
    );
  }

  @RequirePermission('notifications:update')
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() request: any) {
    return this.notificationsService.markAsRead(id, request.user.id);
  }

  @RequirePermission('notifications:update')
  @Patch('user/:userId/read-all')
  markAllAsRead(@Param('userId') userId: string, @Req() request: any) {
    return this.notificationsService.markAllAsRead(this.owner(userId, request));
  }

  @RequirePermission('notifications:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() request: any) {
    return this.notificationsService.remove(id, request.user.id);
  }

  @RequirePermission('notifications:delete')
  @Delete('user/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUserNotifications(
    @Param('userId') userId: string,
    @Req() request: any,
  ) {
    return this.notificationsService.deleteUserNotifications(
      this.owner(userId, request),
    );
  }
}

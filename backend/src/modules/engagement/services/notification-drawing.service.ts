import { Injectable } from '@nestjs/common';

import { NotificationBroadcastService } from '../notification-broadcast.service';
import { NotificationType } from '@/common/enums';
import { Drawing } from '@/modules/documents/models/drawing.model';
import { DrawingRevision } from '@/modules/documents/models/drawing-revision.model';

@Injectable()
export class NotificationForDrawingService {
  constructor(
    private readonly notificationBroadcastService: NotificationBroadcastService,
  ) {}

  async notifyDrawingUploaded(
    drawing: Drawing,
    revision: DrawingRevision,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.DRAWING_UPLOADED,
      title: 'New Drawing Uploaded',
      message: `Drawing "${drawing.drawingNumber}" - ${drawing.title} (Rev. ${revision.revision}) has been uploaded.`,
    });
  }

  async notifyDrawingSuperseded(
    drawingNumber: string,
    projectName: string | null,
    actorId: string,
  ): Promise<void> {
    await this.notificationBroadcastService.broadcast({
      excludedUserId: actorId,
      type: NotificationType.DRAWING_SUPERSEDED,
      title: 'Drawing Superseded',
      message: `Previous revisions of drawing "${drawingNumber}"${
        projectName ? ` in project "${projectName}"` : ''
      } have been marked as superseded.`,
    });
  }
}

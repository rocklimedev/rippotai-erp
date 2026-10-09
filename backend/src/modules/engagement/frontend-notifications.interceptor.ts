import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ModuleRef } from '@nestjs/core';
import { Observable, concatMap } from 'rxjs';
import { AuthService } from '@/modules/auth/auth.service';
import { NotificationType } from '@/common/enums';
import { NotificationBroadcastService } from './notification-broadcast.service';
import {
  frontendNotificationSource,
  FrontendNotificationSource,
} from './frontend-notification-sources';

@Injectable()
export class FrontendNotificationsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FrontendNotificationsInterceptor.name);
  constructor(
    private readonly broadcast: NotificationBroadcastService,
    private readonly moduleRef: ModuleRef,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();
    const controller = context.getClass();
    const source = frontendNotificationSource(
      controller.name,
      Reflect.getMetadata(PATH_METADATA, controller) ?? '',
      context.getHandler().name,
    );
    const request = context.switchToHttp().getRequest();
    if (!source || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method))
      return next.handle();
    // The handler's promise resolves after its transaction commits. Exceptions
    // never enter concatMap, and a notification failure cannot fail a saved action.
    return next.handle().pipe(
      concatMap(async (result) => {
        try {
          await this.publish(
            source,
            context.getHandler().name,
            request,
            result,
          );
        } catch (error) {
          this.logger.error(
            `Notification failed for ${controller.name}.${context.getHandler().name}: ${error.message}`,
          );
        }
        return result;
      }),
    );
  }

  private async publish(
    source: FrontendNotificationSource,
    handler: string,
    request: any,
    result: any,
  ) {
    const record =
      typeof result?.get === 'function'
        ? result.get({ plain: true })
        : (result?.data ?? result);
    if (record?.success === false || record?.deleted === false) return;
    // Personal notes are never broadcast, including a shared note made private.
    if (
      source.sharedOnly &&
      record?.is_shared !== true &&
      record?.is_shared !== 1
    )
      return;

    let actorId = request.user?.id;
    if (!actorId) {
      const token = /^Bearer\s+(.+)$/i.exec(
        request.headers?.authorization || '',
      )?.[1];
      if (!token) return;
      try {
        actorId = (
          await this.moduleRef
            .get(AuthService, { strict: false })
            .getCurrentUser(token)
        ).id;
      } catch {
        return;
      }
    }
    if (!actorId) return;

    const action = source.actions[handler];
    const params = request.params || {};
    let id = source.idParam ? params[source.idParam] : undefined;
    for (const field of source.idFields || []) {
      id ??= record?.[field] ?? request.body?.[field];
    }
    // Do not interpret a child row's ID as a parent workspace ID when only a
    // parent field is allowed. The frontend falls back to the relevant register.
    if (!source.idFields?.length || (source.idParam && params[source.idParam]))
      id ??= params.id ?? record?.id;
    if (source.listHandlers?.includes(handler)) id = undefined;
    const name =
      record?.title ||
      record?.name ||
      record?.drawingNumber ||
      record?.po_number ||
      record?.work_order_number;
    const subject =
      typeof name === 'string' && name.trim()
        ? `“${name.trim().slice(0, 160)}”`
        : source.label;
    const status = record?.status;
    const statusDetail =
      typeof status === 'string' && status.length <= 50 ? ` (${status})` : '';
    await this.broadcast.broadcast({
      excludedUserId: actorId,
      type: NotificationType.SYSTEM,
      entity_type: source.entity,
      entity_id:
        action === 'deleted' || id === undefined || id === null
          ? undefined
          : String(id),
      title: `${source.label} ${action}`,
      message: `${subject} ${action}${statusDetail}.`,
    });
  }
}

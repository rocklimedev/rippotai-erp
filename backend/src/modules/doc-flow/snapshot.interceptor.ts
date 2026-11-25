import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { from, Observable, concatMap } from 'rxjs';
import { snapshotTargetFor } from './doc-registry';
import { DocFlowService } from './doc-flow.service';

/**
 * Keeps the previous state of a flow document whenever it is saved again:
 * before a registered update handler runs, the current row (and its child
 * rows) is captured; once the handler succeeds it is stored as a numbered
 * revision. A failed save stores nothing.
 */
@Injectable()
export class DocumentSnapshotInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DocumentSnapshotInterceptor.name);
  constructor(private readonly flow: DocFlowService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest();
    if (!['PUT', 'PATCH', 'POST', 'DELETE'].includes(request.method))
      return next.handle();
    const path = Reflect.getMetadata(PATH_METADATA, context.getHandler());
    const hit = snapshotTargetFor(context.getClass().name, String(path ?? ''), request.method);
    const key = hit && request.params?.[hit.target.param];
    if (!hit || !key) return next.handle();
    return from(
      this.flow
        .captureBefore(hit.doc, key, hit.target.by, hit.target.child)
        .catch((e) => {
          this.logger.warn(`Snapshot capture failed: ${e.message}`);
          return undefined;
        }),
    ).pipe(
      concatMap((captured) =>
        next.handle().pipe(
          concatMap(async (result) => {
            if (captured)
              await this.flow
                .commitSnapshot(hit.doc, captured, request.user)
                .catch((e) =>
                  this.logger.warn(`Snapshot save failed: ${e.message}`),
                );
            return result;
          }),
        ),
      ),
    );
  }
}

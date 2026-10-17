import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ServiceUnavailableException,
  UseInterceptors,
} from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Observable } from 'rxjs';
import { PERMISSION_KEY } from '../../common/decorator/require-permission.decorator';
import { ExportJobsService } from './export-jobs.service';
import { ExportArgument } from './export.types';

export const EXPORT_HANDLER = 'export_original_handler';
export const EXPORT_KIND = 'export_kind';
const requestContext = new AsyncLocalStorage<{
  request: any;
  response: any;
  jobs: ExportJobsService;
  permission: string;
}>();

@Injectable()
export class ExportJobInterceptor implements NestInterceptor {
  constructor(private readonly jobs: ExportJobsService) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const http = context.switchToHttp();
    const state = {
      request: http.getRequest(),
      response: http.getResponse(),
      jobs: this.jobs,
      permission: Reflect.getMetadata(PERMISSION_KEY, context.getHandler()),
    };
    // Subscribe inside ALS so the method runs here *after* Nest's DTO pipes.
    return new Observable((subscriber) =>
      requestContext.run(state, () => next.handle().subscribe(subscriber)),
    );
  }
}

/** The method body is executed exclusively by the export child process. HTTP
 * calls validate their normal DTOs/guards, enqueue, and immediately return 202. */
export function AsyncExport(kind: string): MethodDecorator {
  return (target, property, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const wrapped = async function (...args: unknown[]) {
      const context = requestContext.getStore();
      if (!context)
        throw new ServiceUnavailableException(
          'Export methods require the job worker',
        );
      const { request, response, jobs, permission } = context;
      const serialized: ExportArgument[] = args.map((value) =>
        value === request
          ? { source: 'request' }
          : value === response
            ? { source: 'response' }
            : value === request.user
              ? { source: 'actor' }
              : { source: 'literal', value },
      );
      const result = await jobs.enqueue(
        kind,
        serialized,
        request.user,
        permission,
      );
      response.status(202).setHeader('Cache-Control', 'private, no-store');
      if (serialized.some((arg) => arg.source === 'response'))
        response.json(result);
      else return result;
    };
    // Nest stores routes, guards and parameter type metadata on the function.
    for (const key of Reflect.getMetadataKeys(original))
      Reflect.defineMetadata(key, Reflect.getMetadata(key, original), wrapped);
    Object.defineProperty(wrapped, 'name', { value: original.name });
    Reflect.defineMetadata(EXPORT_HANDLER, original, wrapped);
    Reflect.defineMetadata(EXPORT_KIND, kind, wrapped);
    descriptor.value = wrapped;
    UseInterceptors(ExportJobInterceptor)(target, property, descriptor);
  };
}

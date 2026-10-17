import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { EXPORT_HANDLER, EXPORT_KIND } from './async-export.decorator';
import { EXPORT_HANDLERS } from './export.registry';
import { ExportData, ExportResult } from './export.types';
import { CdnService } from '../cdn/cdn.service';
import { exportConfig } from './export.config';

export async function executeExport(data: ExportData): Promise<ExportResult> {
  const entry = EXPORT_HANDLERS[data.kind as keyof typeof EXPORT_HANDLERS];
  if (!entry) throw new Error('Unsupported export type');
  // Resolve providers without app.init/listen: no API server, seeders, automation
  // timers or other application lifecycle hooks run in export children.
  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });
  try {
    const [controller, method] = entry;
    const instance = app.get(controller as any);
    const wrapped = instance[method];
    if (Reflect.getMetadata(EXPORT_KIND, wrapped) !== data.kind)
      throw new Error('Export registry mismatch');
    const handler = Reflect.getMetadata(EXPORT_HANDLER, wrapped);
    const headers: Record<string, string> = {};
    let sent: unknown;
    let didSend = false;
    const response = {
      setHeader(name: string, value: string) {
        headers[name.toLowerCase()] = value;
        return response;
      },
      set(values: Record<string, string>) {
        for (const [key, value] of Object.entries(values))
          response.setHeader(key, value);
        return response;
      },
      status(code: number) {
        if (code >= 400) throw new Error(`Export returned HTTP ${code}`);
        return response;
      },
      send(value: unknown) {
        sent = value;
        didSend = true;
        return response;
      },
      json(value: unknown) {
        sent = value;
        didSend = true;
        return response;
      },
    };
    const req = { user: data.actor, exportOperationId: data.operationId };
    const args = data.args.map((arg) =>
      arg.source === 'literal'
        ? arg.value
        : arg.source === 'request'
          ? req
          : arg.source === 'actor'
            ? { ...data.actor, exportOperationId: data.operationId }
            : response,
    );
    const returned = await handler.apply(instance, args);
    const value = didSend ? sent : returned;
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
      const bytes = Buffer.from(value);
      if (bytes.length > exportConfig().maxResultBytes)
        throw new Error('Export exceeds configured result size');
      const filename =
        headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] ||
        'export.bin';
      const stored = await app.get(CdnService).uploadBuffer(bytes, filename);
      return {
        type: 'file',
        key: stored.filename,
        filename,
        mime: headers['content-type'] || 'application/octet-stream',
        size: bytes.length,
      };
    }
    const plain = JSON.parse(JSON.stringify(value ?? null));
    if (
      Buffer.byteLength(JSON.stringify(plain)) > exportConfig().maxResultBytes
    )
      throw new Error('Export exceeds configured result size');
    return { type: 'json', value: plain };
  } finally {
    await app.close();
  }
}

process.once('message', async (data: ExportData) => {
  try {
    const result = await executeExport(data);
    process.send?.({ result }, () => process.exit(0));
  } catch (error) {
    // Keep SQL and credentials out of user-visible queue errors.
    const name = error instanceof Error ? error.name : 'Error';
    const message =
      error instanceof Error &&
      /^(BadRequest|NotFound|Conflict)Exception$/.test(name)
        ? error.message
        : `Document generation failed (${name})`;
    process.send?.(
      {
        error: message,
        retryable: !/^(BadRequest|NotFound|Conflict)Exception$/.test(name),
      },
      () => process.exit(1),
    );
  }
});

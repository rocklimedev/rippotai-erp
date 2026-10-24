import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Writable } from 'stream';
import { CdnService } from './cdn.service';
import { NasService } from './nas.service';
import {
  cdnBaseUrl,
  fileScope,
  signFileReference,
  privateFileUrl,
  verifyFileAccess,
} from './file-access';
import { MAX_UPLOAD_BYTES, validateUploadType } from './upload-security';

@Injectable()
export class NasTestService {
  constructor(
    private readonly nas: NasService,
    private readonly cdn: CdnService,
  ) {}

  private ready() {
    if (!this.nas.enabled())
      throw new ServiceUnavailableException(
        'NAS is disabled. Configure and enable NAS on the backend first.',
      );
    if (
      process.env.CDN_HOST &&
      process.env.CDN_PRIVATE_PROXY_ENABLED !== 'true'
    )
      throw new ServiceUnavailableException(
        'Configure the CDN private-file proxy before testing NAS downloads.',
      );
  }

  private async save(
    source: Buffer | string,
    name: string,
    scope: string,
    size: number,
  ) {
    if (scope !== 'documents' && scope !== 'drawings')
      throw new BadRequestException('Choose documents or drawings');
    if (size <= 0 || size > MAX_UPLOAD_BYTES)
      throw new BadRequestException(
        'Test files must be between 1 byte and 25 MiB',
      );
    const key = `private-${scope}-nas-${randomUUID()}${extname(name).toLowerCase()}`;
    // put performs a SHA256 read-back check before publishing the final file.
    await this.nas.put(key, source);
    return {
      filename: key,
      bytes: size,
      verified: true,
      storage: 'nas',
      url: signFileReference(privateFileUrl(key)),
    };
  }

  async upload(file: Express.Multer.File, scope: string) {
    this.ready();
    if (!file) throw new BadRequestException('Select a file');
    validateUploadType(file);
    return this.save(
      file.path || file.buffer,
      file.originalname,
      scope,
      file.size,
    );
  }

  async copy(reference: unknown) {
    this.ready();
    if (typeof reference !== 'string')
      throw new BadRequestException(
        'Provide a current signed CDN download link',
      );
    let url: URL;
    try {
      url = new URL(reference);
    } catch {
      throw new BadRequestException('Invalid CDN download link');
    }
    const base = `${cdnBaseUrl()}/`;
    if (!reference.startsWith(base))
      throw new BadRequestException('Use a download link from this ERP CDN');
    const key = url.pathname.slice(new URL(base).pathname.length);
    const scope = fileScope(key);
    if (
      (scope !== 'documents' && scope !== 'drawings') ||
      key.includes('-nas-')
    )
      throw new BadRequestException(
        'Choose an existing CDN document or drawing',
      );
    // Possession of an unexpired capability proves access to this source file.
    // Never fetch a caller-supplied URL; read only the validated storage key.
    verifyFileAccess(
      key,
      url.searchParams.get('expires') || '',
      url.searchParams.get('signature') || '',
    );
    let size = 0;
    const chunks: Buffer[] = [];
    await this.cdn.streamFile(
      key,
      new Writable({
        write(chunk, _encoding, callback) {
          size += chunk.length;
          if (size > MAX_UPLOAD_BYTES)
            return callback(
              new BadRequestException('Test files must be 25 MiB or smaller'),
            );
          chunks.push(Buffer.from(chunk));
          callback();
        },
      }),
    );
    return this.save(Buffer.concat(chunks), key, scope, size);
  }
}

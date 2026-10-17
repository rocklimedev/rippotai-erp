import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import * as path from 'path';

export const FILE_SCOPES = {
  documents: 'documents:read',
  drawings: 'drawings:read',
  signatures: 'user-signatures:read',
  handover: 'client-portal:read',
  recce: 'site-recces:read',
  briefs: 'project-briefs:read',
  reports: 'site-ops-daily-reports:read',
  snags: 'site-ops-snag-lists:read',
} as const;
export type FileScope = keyof typeof FILE_SCOPES;
export const FILE_LINK_TTL_SECONDS = 300;

export function privateRoot(): string {
  const uploadPath = process.env.CDN_UPLOAD_PATH || '/tmp/inos-cdn';
  if (process.env.CDN_HOST) {
    // Remote SFTP paths belong to the CDN server, even when Node runs on Windows.
    if (!path.posix.isAbsolute(uploadPath))
      throw new ServiceUnavailableException(
        'CDN_UPLOAD_PATH must be the absolute directory on the CDN server, not a local Windows path or URL',
      );
    return uploadPath;
  }
  const root = process.env.PRIVATE_FILE_PATH || `${uploadPath}-private`;
  const relative = path.relative(path.resolve(uploadPath), path.resolve(root));
  if (
    !relative ||
    !(
      relative === '..' ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    )
  ) {
    throw new ServiceUnavailableException(
      'Local PRIVATE_FILE_PATH must be outside the public CDN directory',
    );
  }
  return path.resolve(root);
}

export function cdnBaseUrl(): string {
  const configured = process.env.CDN_BASE_URL?.trim();
  const base = configured || `http://localhost:${process.env.PORT || 5000}/cdn`;
  const url = new URL(base);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (process.env.NODE_ENV === 'production' &&
      (!configured || url.protocol !== 'https:'))
  ) {
    throw new ServiceUnavailableException(
      'CDN_BASE_URL must be the absolute HTTPS CDN URL in production',
    );
  }
  return base.replace(/\/+$/, '');
}

export function privateFileUrl(key: string): string {
  if (!fileScope(key)) throw new ForbiddenException('Invalid private file key');
  return `${cdnBaseUrl()}/${key}`;
}

export function privateFileKey(reference: string): string | undefined {
  const prefix = reference.startsWith('private-file://')
    ? 'private-file://'
    : `${cdnBaseUrl()}/`;
  if (!reference.startsWith(prefix)) return undefined;
  const key = reference.slice(prefix.length);
  return fileScope(key) ? key : undefined;
}

export function fileScope(key: string): FileScope | undefined {
  const match = /^private-([a-z]+)-[0-9a-f-]{36}(?:\.[a-zA-Z0-9]{1,16})?$/.exec(
    key,
  );
  return match && Object.prototype.hasOwnProperty.call(FILE_SCOPES, match[1])
    ? (match[1] as FileScope)
    : undefined;
}

export function validateStorageKey(key: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(key) || key.includes('..')) {
    throw new ForbiddenException('Invalid file key');
  }
}

function secret(): string {
  const value = process.env.FILE_ACCESS_SECRET;
  if (!value || Buffer.byteLength(value) < 32) {
    throw new ServiceUnavailableException(
      'FILE_ACCESS_SECRET must contain at least 32 bytes',
    );
  }
  return value;
}

function signature(key: string, expires: string): string {
  return createHmac('sha256', secret())
    .update(`file-access-v1\n${key}\n${expires}`)
    .digest('hex');
}

export function validateFileConfiguration(): void {
  // Remote upload-directory errors must not take unrelated API traffic down.
  // SFTP operations validate that directory when it is actually used.
  if (!process.env.CDN_HOST) privateRoot();
  secret();
  cdnBaseUrl();
}

export function signFileReference(
  reference: string,
  expiresAt?: number,
): string {
  const key = privateFileKey(reference);
  if (!key || !fileScope(key))
    throw new ForbiddenException('Invalid private file reference');
  const expires = String(
    Math.min(
      Math.floor(Date.now() / 1000) + FILE_LINK_TTL_SECONDS,
      expiresAt ?? Infinity,
    ),
  );
  return `${privateFileUrl(key)}?expires=${expires}&signature=${signature(key, expires)}`;
}

export function verifyFileAccess(
  key: string,
  expires: string,
  supplied: string,
): void {
  const now = Math.floor(Date.now() / 1000);
  if (
    !fileScope(key) ||
    typeof expires !== 'string' ||
    typeof supplied !== 'string' ||
    !/^\d+$/.test(expires) ||
    Number(expires) <= now ||
    Number(expires) > now + FILE_LINK_TTL_SECONDS ||
    !/^[a-f0-9]{64}$/.test(supplied)
  ) {
    throw new ForbiddenException('Invalid or expired file link');
  }
  if (
    !timingSafeEqual(
      Buffer.from(signature(key, expires), 'hex'),
      Buffer.from(supplied, 'hex'),
    )
  ) {
    throw new ForbiddenException('Invalid or expired file link');
  }
}

// Upload UIs pass their returned preview URL back when saving a record. Persist
// the durable reference instead of an expiring capability.
export function normalizeFileLink(value: string): string {
  if (value.startsWith('private-file://')) {
    const key = privateFileKey(value);
    return key ? privateFileUrl(key) : value;
  }
  const cdnPrefix = `${cdnBaseUrl()}/`;
  const legacyBase =
    process.env.FILE_ACCESS_BASE_URL ||
    `http://localhost:${process.env.PORT || 5000}/api/v1`;
  const legacyPrefix = `${legacyBase.replace(/\/$/, '')}/cdn/private/`;
  if (!value.startsWith(cdnPrefix) && !value.startsWith(legacyPrefix))
    return value;
  if (privateFileKey(value)) return value;
  const url = new URL(value);
  const key = url.pathname.split('/').pop()!;
  if (!key.startsWith('private-')) return value;
  const expires = url.searchParams.get('expires') || '';
  const supplied = url.searchParams.get('signature') || '';
  // Saving an authenticated form may happen after its preview link expires.
  // Validate provenance here; the download endpoint still enforces expiry.
  if (
    !fileScope(key) ||
    !/^\d+$/.test(expires) ||
    !/^[a-f0-9]{64}$/.test(supplied) ||
    !timingSafeEqual(
      Buffer.from(signature(key, expires), 'hex'),
      Buffer.from(supplied, 'hex'),
    )
  ) {
    throw new ForbiddenException('Invalid file reference');
  }
  return privateFileUrl(key);
}

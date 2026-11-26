import { BadRequestException } from '@nestjs/common';

const MAP_HOSTS = new Set([
  'www.google.com',
  'google.com',
  'maps.google.com',
  'www.google.co.in',
  'google.co.in',
  'maps.google.co.in',
]);

export function isGoogleMapsShortLink(link: URL): boolean {
  return link.hostname === 'maps.app.goo.gl' || link.hostname === 'goo.gl';
}

export function parseGoogleMapsUrl(value: unknown): URL {
  let link: URL;
  try {
    if (typeof value !== 'string' || value.length > 4096) throw new Error();
    link = new URL(value.trim());
  } catch {
    throw new BadRequestException('Paste a valid Google Maps link.');
  }
  const short =
    link.hostname === 'maps.app.goo.gl'
      ? /^\/[\w-]+\/?$/.test(link.pathname)
      : link.hostname === 'goo.gl' && /^\/maps\/[\w-]+\/?$/.test(link.pathname);
  const maps =
    MAP_HOSTS.has(link.hostname) &&
    (/^\/maps(?:\/|$)/.test(link.pathname) ||
      (link.hostname.startsWith('maps.') && link.pathname === '/'));
  if (
    link.protocol !== 'https:' ||
    link.username ||
    link.password ||
    link.port ||
    (!short && !maps)
  ) {
    throw new BadRequestException('Paste a Google Maps place or pin link.');
  }
  return link;
}

export function normalizeGoogleMapsUrl(value: unknown): string | null {
  if (value == null || (typeof value === 'string' && !value.trim()))
    return null;
  return parseGoogleMapsUrl(value).href;
}

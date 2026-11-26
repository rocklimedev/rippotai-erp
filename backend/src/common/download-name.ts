import { extname } from 'node:path';

const UUID = /[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/i;

export function downloadName(
  names: (string | null | undefined)[],
  sourceName: string | null | undefined,
  fallback: string,
): string {
  const extension =
    /\.[a-z\d]{1,12}$/i.exec(extname(sourceName || ''))?.[0] || '';
  const parts = names
    .map((name) =>
      name
        ?.replace(/[<>:"/\\|?*\p{Cc}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((name): name is string => !!name && !UUID.test(name))
    .map((name) =>
      extension && name.toLowerCase().endsWith(extension.toLowerCase())
        ? name.slice(0, -extension.length)
        : name,
    )
    .filter(Boolean);
  const stem = [...new Set(parts)].join(' - ') || fallback;
  return `${
    Array.from(stem)
      .slice(0, 140)
      .join('')
      .replace(/[. ]+$/, '') || fallback
  }${extension}`;
}

export function downloadDisposition(
  name: string,
  disposition = 'attachment',
): string {
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, '_');
  const encoded = encodeURIComponent(
    Buffer.from(name).toString('utf8'),
  ).replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`);
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

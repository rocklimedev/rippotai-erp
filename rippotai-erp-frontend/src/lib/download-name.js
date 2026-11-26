const UUID = /[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/i;

export function filenameFromDisposition(disposition) {
  const encoded = /(?:^|;)\s*filename\*=UTF-8''([^;]+)/i.exec(disposition || '')?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      // Older servers may supply only a usable basic filename.
    }
  }
  return /(?:^|;)\s*filename=(?:"([^"]+)"|([^;]+))/i
    .exec(disposition || '')
    ?.slice(1)
    .find(Boolean);
}

export function downloadName(names, sourceName, fallback) {
  const extension = /\.[a-z\d]{1,12}$/i.exec(sourceName || '')?.[0] || '';
  const parts = names
    .map((name) =>
      name
        ?.replace(/[<>:"/\\|?*\p{Cc}]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((name) => name && !UUID.test(name))
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

export function responseDownloadName(disposition, fallbackName, fallback = 'Download') {
  const name = filenameFromDisposition(disposition);
  const preferred = name && !UUID.test(name) ? name : fallbackName;
  const source = /\.[a-z\d]{1,12}$/i.test(name || '') ? name : fallbackName;
  return downloadName([preferred], source, fallback);
}

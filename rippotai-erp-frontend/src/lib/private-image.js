// The print document mounts both measuring and visible copies of each image.
// Share one in-memory download between them and bound requests to the SSH proxy.
const images = new Map();
const waiting = [];
let active = 0;

async function download(src) {
  if (active >= 2) await new Promise((resolve) => waiting.push(resolve));
  else active++;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(src, {
        credentials: "omit",
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) return URL.createObjectURL(await response.blob());
      // Expired/invalid signatures need a new API response, not repeated requests.
      if (response.status < 500 || attempt === 2) {
        throw new Error(`Image download failed (${response.status})`);
      }
      await response.body?.cancel();
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

export function acquirePrivateImage(src) {
  let entry = images.get(src);
  if (!entry) {
    entry = { users: 0, objectUrl: null, settled: false };
    entry.promise = download(src).then((url) => {
      entry.objectUrl = url;
      return url;
    }).finally(() => {
      entry.settled = true;
      dispose();
    });
    images.set(src, entry);
  }
  function dispose() {
    // Allow React StrictMode's immediate remount to reuse the pending download.
    setTimeout(() => {
      if (entry.users || !entry.settled || images.get(src) !== entry) return;
      images.delete(src);
      if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    }, 0);
  }
  entry.users++;
  let released = false;
  return {
    promise: entry.promise,
    release() {
      if (released) return;
      released = true;
      entry.users--;
      dispose();
    },
  };
}

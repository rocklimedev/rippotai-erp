// Bound SSH sessions for image grids. Keep the slot until transfer and cleanup
// finish, so queued downloads cannot flood the server's SSH handshake limit.
const MAX_DOWNLOADS = 3;
let active = 0;
const waiting: Array<() => void> = [];

export async function withCdnDownloadSlot<T>(operation: () => Promise<T>): Promise<T> {
  if (active >= MAX_DOWNLOADS) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  } else {
    active++;
  }
  try {
    return await operation();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

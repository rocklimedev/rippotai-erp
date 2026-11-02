import { withCdnDownloadSlot } from './cdn-download-gate';

it('limits downloads to three sessions and releases slots after failures', async () => {
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 12 }, (_, index) =>
    withCdnDownloadSlot(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setImmediate(resolve));
      active--;
      if (index % 2) throw new Error('transfer failed');
    }),
  );
  const results = await Promise.allSettled(tasks);
  expect(peak).toBe(3);
  expect(results.filter((result) => result.status === 'rejected')).toHaveLength(6);
  await expect(withCdnDownloadSlot(async () => 'released')).resolves.toBe('released');
});

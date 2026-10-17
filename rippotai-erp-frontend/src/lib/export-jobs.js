/** Resolve the queued export protocol before an existing blob/JSON handler runs. */
export async function awaitExportResponse(initial, options) {
  const { apiBase, fetchImpl = fetch, headers, signal, onStatus = () => {}, pollMs = 1000, maxWaitMs = 15 * 60 * 1000 } = options;
  if (initial.status !== 202) return initial;
  const submitted = await initial.clone().json();
  if (!submitted.jobId || !submitted.statusUrl) return initial;
  const validPath = path => /^\/export-jobs\/[a-f0-9-]{36}(?:\/result|\/retry)?$/.test(path);
  const url = path => {
    if (!validPath(path)) throw new Error('Invalid export job URL');
    return `${apiBase.replace(/\/$/, '')}${path}`;
  };
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    if (signal?.aborted) throw new DOMException('Export wait cancelled; the job continues in the background', 'AbortError');
    const response = await fetchImpl(url(submitted.statusUrl), { headers, credentials: 'include', signal, cache: 'no-store' });
    const job = await response.json();
    if (!response.ok) throw new Error(job.message || 'Could not retrieve export status');
    onStatus(job);
    if (job.state === 'completed') {
      const result = await fetchImpl(url(job.resultUrl), { headers, credentials: 'include', signal, cache: 'no-store' });
      if (!result.ok) throw new Error('Could not download the completed export');
      return result;
    }
    if (job.state === 'failed') {
      const error = new Error(`Export failed after ${job.attemptsMade} attempt(s): ${job.failedReason || 'generation failed'}`);
      Object.assign(error, { jobId: job.jobId, retryAvailable: job.retryAvailable, statusUrl: submitted.statusUrl });
      throw error;
    }
    await new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Export wait cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, pollMs);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }
  const error = new Error(`Export ${submitted.jobId} is still queued or running. It continues in the background.`);
  Object.assign(error, { jobId: submitted.jobId, statusUrl: submitted.statusUrl });
  throw error;
}

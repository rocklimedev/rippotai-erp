import { toast } from 'sonner';
import { API_URL } from './config';
import { awaitExportResponse } from './export-jobs';

export async function resolveExportResponse(response, { headers, signal } = {}) {
  if (response.status !== 202) return response;
  const descriptor = await response.clone().json().catch(() => null);
  if (!descriptor?.jobId) return response;
  const toastId = `export-${descriptor.jobId}`;
  const options = {
    apiBase: API_URL, headers, signal,
    onStatus: job => toast.loading(
      job.state === 'delayed' ? `Export retry scheduled (attempt ${job.attemptsMade})` :
        job.state === 'active' ? `Generating export (attempt ${job.attemptsStarted || 1})` : 'Export queued',
      { id: toastId },
    ),
  };
  try {
    const result = await awaitExportResponse(response, options);
    toast.success('Export ready', { id: toastId });
    return result;
  } catch (error) {
    toast.error(error.message, {
      id: toastId, duration: 15000,
      ...(error.retryAvailable ? { action: { label: 'Retry', onClick: async () => {
        try {
          const retried = await fetch(`${API_URL}/export-jobs/${error.jobId}/retry`, { method: 'POST', headers, credentials: 'include' });
          if (!retried.ok) throw new Error('Could not retry the export');
          const result = await resolveExportResponse(retried, { headers });
          if (result.headers.get('content-disposition')) {
            const href = URL.createObjectURL(await result.blob());
            const link = document.createElement('a');
            link.href = href;
            link.download = result.headers.get('content-disposition').match(/filename="([^"]+)"/)?.[1] || 'export';
            link.click();
            setTimeout(() => URL.revokeObjectURL(href), 1000);
          } else toast.success('Document saved. Refresh to view it.');
        } catch (retryError) { toast.error(retryError.message); }
      } } } : {}),
    });
    throw error;
  }
}

export async function exportAwareFetch(input, init) {
  const request = new Request(input, init);
  return resolveExportResponse(await fetch(request), { headers: request.headers, signal: request.signal });
}

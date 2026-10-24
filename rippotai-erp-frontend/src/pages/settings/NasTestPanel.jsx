import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNasTestUploadMutation, useNasTestCopyMutation } from '@/api/meta/cdn.api';

export default function NasTestPanel({ connected, onComplete }) {
  const [file, setFile] = useState(null);
  const [scope, setScope] = useState('documents');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [upload, uploadState] = useNasTestUploadMutation();
  const [copy, copyState] = useNasTestCopyMutation();
  const busy = uploadState.isLoading || copyState.isLoading;
  async function run(mode) {
    setError(''); setResult(null);
    if (mode === 'upload' && (!file || file.size === 0 || file.size > 25 * 1024 * 1024)) {
      setError('Select a nonempty file of 25 MiB or smaller.'); return;
    }
    try {
      const response = await (mode === 'upload' ? upload({ file, scope }) : copy(url.trim())).unwrap();
      setResult(response); onComplete();
    } catch (failure) {
      const message = failure?.data?.message;
      setError(failure?.status === 403 ? 'You need permission to update settings to run NAS tests.' :
        (Array.isArray(message) ? message.join(', ') : message) || 'NAS test failed. Check connection settings, folder permissions and backend logs.');
    }
  }
  const inputClass = 'w-full rounded-md border border-[#D3DEDA] bg-white p-2 text-sm';
  return <div className="space-y-4 border-t border-[#E4EAE7] px-6 py-4">
    <div>
      <h4 className="font-medium text-[#22302D]">Test NAS uploads</h4>
      <p className="mt-1 text-sm text-[#6B7B7C]">Upload a document or drawing to NAS, or copy an existing CDN file. Maximum 25 MiB. Tests bypass the normal size threshold and temporary storage, and verify file contents after upload.</p>
      <p className="mt-1 text-sm text-[#6B7B7C]">Each test creates a separate file on NAS. Existing CDN files and ERP records stay unchanged. Test files remain in the NAS folder until removed by your administrator.</p>
      {!connected && <p className="mt-2 text-sm text-amber-700">Configure NAS and check the connection above before testing.</p>}
    </div>
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-sm">File type
          <select className={inputClass} value={scope} disabled={busy} onChange={e => setScope(e.target.value)}>
            <option value="documents">Document</option><option value="drawings">Drawing</option>
          </select>
        </label>
        <label className="block text-sm">Select a test file
          <input className={inputClass} type="file" disabled={busy} accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.dwg,.dxf" onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setError(''); }} />
        </label>
        <Button type="button" variant="outline" disabled={!connected || busy || !file} onClick={() => run('upload')}>{uploadState.isLoading ? 'Uploading and verifying…' : 'Upload directly to NAS'}</Button>
      </div>
      <div className="space-y-3">
        <label className="block text-sm">Current signed CDN download link
          <input className={inputClass} type="url" placeholder="Paste a document or drawing download link" value={url} disabled={busy} onChange={e => { setUrl(e.target.value); setResult(null); setError(''); }} />
        </label>
        <p className="text-sm text-[#6B7B7C]">Copy the current signed link from a document or drawing download. Links expire after five minutes; reopen the file to obtain a fresh link.</p>
        <Button type="button" variant="outline" disabled={!connected || busy || !url.trim()} onClick={() => run('copy')}>{copyState.isLoading ? 'Copying and verifying…' : 'Copy CDN file to NAS'}</Button>
      </div>
    </div>
    {busy && <p role="status" className="text-sm">Transferring the file and checking its contents. Please wait.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {result && <div role="status" className="space-y-1 rounded-md bg-green-50 p-3 text-sm text-green-900">
      <p>NAS upload successful. SHA256 verification passed.</p>
      <p className="break-all">{result.filename} · {Number(result.bytes).toLocaleString()} bytes</p>
      <a className="underline" href={result.url} target="_blank" rel="noreferrer">Open test file (link valid for five minutes)</a>
    </div>}
  </div>;
}

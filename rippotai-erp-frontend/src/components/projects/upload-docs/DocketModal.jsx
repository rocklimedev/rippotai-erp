// Drawing docket: pick a project + trade (e.g. Electrical) and get ONE PDF with
// the latest version of every drawing in that trade.
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Download, Eye } from 'lucide-react';
import { Button, Field, SelectInput } from '@/components/inos';
import { Modal } from '@/components/projects/_projects-ui';
import { openInNewTab } from '@/components/record-context/openFile';
import { saveBlob } from './uploadDocs';

const NONE = '__none__';

export default function DocketModal({ cfg, rows, onClose }) {
  const projects = useMemo(() => {
    const m = new Map();
    rows.filter((r) => r.hasFile).forEach((r) => m.set(r.projectId, r.projectName));
    return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [rows]);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');

  const trades = useMemo(() => {
    const m = new Map();
    rows
      .filter((r) => r.hasFile && r.projectId === projectId && r.typeId)
      .forEach((r) => m.set(r.typeId, { id: r.typeId, name: r.typeName, count: (m.get(r.typeId)?.count || 0) + 1 }));
    return [...m.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [rows, projectId]);
  const [tradeId, setTradeId] = useState('');
  const trade = trades.find((t) => t.id === tradeId) || trades[0];

  const drawings = rows
    .filter((r) => r.hasFile && r.projectId === projectId && r.typeId === trade?.id)
    .sort((a, b) => String(a.title).localeCompare(String(b.title), undefined, { numeric: true }));

  const [busy, setBusy] = useState(false);
  const path = trade ? `/drawings/docket?projectId=${projectId}&documentTypeId=${trade.id}` : null;
  const name = `${trade?.name || 'Drawings'} - ${projects.find((p) => p.id === projectId)?.name || ''}.pdf`;

  const download = async () => {
    setBusy(true);
    try {
      await saveBlob(path, name);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${cfg.name} — single PDF`}
      description="Latest version of every drawing in a trade, merged into one PDF."
      width={620}
      testId="docket-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="secondary" icon={Eye} disabled={!path} onClick={() => openInNewTab(`${path}&inline=1`, { title: name })} data-testid="docket-view">
            View PDF
          </Button>
          <Button variant="primary" icon={Download} disabled={!path} loading={busy} onClick={download} data-testid="docket-download">
            Download PDF
          </Button>
        </>
      }
    >
      <div className="inos-form-grid">
        <Field label="Project" required>
          <SelectInput value={projectId} onChange={(e) => { setProjectId(e.target.value); setTradeId(''); }} data-testid="docket-project">
            {!projects.length && <option value="">No drawings uploaded yet</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Trade / category" required>
          <SelectInput value={trade?.id || NONE} onChange={(e) => setTradeId(e.target.value)} data-testid="docket-trade">
            {!trades.length && <option value={NONE}>No categories</option>}
            {trades.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.count})
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>
      {!!drawings.length && (
        <table className="docket-list" data-testid="docket-drawings">
          <thead>
            <tr>
              <th>#</th>
              <th>Drawing</th>
              <th>Latest</th>
            </tr>
          </thead>
          <tbody>
            {drawings.map((d, i) => (
              <tr key={d.id}>
                <td>{i + 1}</td>
                <td>{d.title || d.typeName}</td>
                <td>
                  <strong>{d.version}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

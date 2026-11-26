// Command Center › Commercial › Client collections: money received from the client
// against each project's total — Token amount or Project payment, with date + note.
import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button, Field, Progress, SelectInput, TextArea, TextInput } from '@/components/inos';
import { Modal } from '@/components/projects/_projects-ui';
import { appConfirm } from '@/lib/app-dialog';
import {
  useAddClientCollectionMutation,
  useDeleteClientCollectionMutation,
  useGetClientCollectionsSummaryQuery,
} from '@/api/payments/client-collections.api';
import './client-collections.css';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const TYPE = { TOKEN: 'Token amount', PROJECT_PAYMENT: 'Project payment' };
const fmt = (d) =>
  d
    ? new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';
const today = () => new Date().toISOString().slice(0, 10);

function AddAmountModal({ projects, projectId, onClose }) {
  const [form, setForm] = useState({
    project_id: projectId || '',
    type: 'TOKEN',
    amount: '',
    received_on: today(),
    note: '',
  });
  const [tried, setTried] = useState(false);
  const [add, { isLoading }] = useAddClientCollectionMutation();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const amount = Number(form.amount);
  const valid = form.project_id && amount > 0 && form.received_on;
  const save = async () => {
    setTried(true);
    if (!valid) return;
    try {
      await add({ ...form, amount, note: form.note.trim() || undefined }).unwrap();
      toast.success(`${TYPE[form.type]} of ${inr(amount)} added`);
      onClose();
    } catch (e) {
      toast.error([e?.data?.message || 'Could not add the amount'].flat().join('. '));
    }
  };
  return (
    <Modal
      open
      onClose={() => !isLoading && onClose()}
      title="Add amount collected"
      width={520}
      testId="add-collection-modal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={save}
            loading={isLoading}
            data-testid="collection-save"
          >
            Add amount
          </Button>
        </>
      }
    >
      <div className="inos-form-grid">
        <Field
          label="Project"
          required
          full
          error={tried && !form.project_id ? 'Choose a project' : null}
        >
          <SelectInput
            value={form.project_id}
            onChange={set('project_id')}
            data-testid="collection-project"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Type" required>
          <SelectInput value={form.type} onChange={set('type')} data-testid="collection-type">
            <option value="TOKEN">Token amount</option>
            <option value="PROJECT_PAYMENT">Project payment</option>
          </SelectInput>
        </Field>
        <Field
          label="Amount (₹)"
          required
          error={tried && !(amount > 0) ? 'Enter the amount' : null}
        >
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={set('amount')}
            placeholder="0"
            data-testid="collection-amount"
          />
        </Field>
        <Field label="Date" required>
          <TextInput
            type="date"
            value={form.received_on}
            max={today()}
            onChange={set('received_on')}
            data-testid="collection-date"
          />
        </Field>
        <Field label="Note" optional full>
          <TextArea
            rows={2}
            maxLength={2000}
            value={form.note}
            onChange={set('note')}
            placeholder="e.g. Cheque no. / UTR, milestone"
            data-testid="collection-note"
          />
        </Field>
      </div>
    </Modal>
  );
}

export default function ClientCollections() {
  const { user } = useAuth();
  const canAdd = (user?.permissions || []).includes('payment-schedules:update');
  const { data, isLoading, isError } = useGetClientCollectionsSummaryQuery(undefined, {
    refetchOnMountOrArgChange: 60,
  });
  const [remove] = useDeleteClientCollectionMutation();
  const [adding, setAdding] = useState(null);
  const [open, setOpen] = useState(null);
  const rows = useMemo(
    () => (data?.rows || []).filter((r) => r.total > 0 || r.collected > 0),
    [data],
  );
  const t = data?.totals;

  const del = async (e) => {
    if (!(await appConfirm(`Remove ${TYPE[e.type]} of ${inr(e.amount)} (${fmt(e.received_on)})?`)))
      return;
    try {
      await remove(e.id).unwrap();
      toast.success('Entry removed');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not remove');
    }
  };

  return (
    <div className="cl" data-testid="client-collections">
      <div className="cl-head">
        <div>
          <p className="cc-detail-head" style={{ margin: 0 }}>
            Collected from clients
          </p>
          <span className="cc-muted">
            Token amount + project payments against each project's total
          </span>
        </div>
        {canAdd && (
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setAdding({})}
            data-testid="collection-add"
          >
            Add amount
          </Button>
        )}
      </div>
      {isLoading && <p className="cc-muted">Loading collections…</p>}
      {isError && <p className="cc-muted">Couldn't load collections.</p>}
      {t && (
        <div className="cl-figures">
          <div>
            <span>Total amount</span>
            <strong>{inr(t.total)}</strong>
          </div>
          <div className="is-ok">
            <span>Collected · {t.pct}%</span>
            <strong>{inr(t.collected)}</strong>
          </div>
          <div>
            <span>Token amount</span>
            <strong>{inr(t.token)}</strong>
          </div>
          <div>
            <span>Project payments</span>
            <strong>{inr(t.payments)}</strong>
          </div>
          <div className="is-warn">
            <span>Balance</span>
            <strong>{inr(t.balance)}</strong>
          </div>
        </div>
      )}
      {!!rows.length && (
        <table className="cl-table">
          <thead>
            <tr>
              <th>Project</th>
              <th className="is-num">Total</th>
              <th className="is-num">Token</th>
              <th className="is-num">Project payments</th>
              <th>Collected</th>
              <th className="is-num">Balance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = open === r.projectId;
              return (
                <Fragment key={r.projectId}>
                  <tr className={isOpen ? 'is-open' : ''}>
                    <td>
                      <button
                        type="button"
                        className="cl-toggle"
                        onClick={() => setOpen(isOpen ? null : r.projectId)}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                        <span>{r.name}</span>
                        {r.entries.length > 0 && <em>{r.entries.length}</em>}
                      </button>
                    </td>
                    <td className="is-num tabular">{inr(r.total)}</td>
                    <td className="is-num tabular">{inr(r.token)}</td>
                    <td className="is-num tabular">{inr(r.payments)}</td>
                    <td className="cl-progress">
                      <Progress value={r.pct} tone={r.pct >= 100 ? 'ok' : undefined} />
                      <span className="tabular">
                        {inr(r.collected)} · {r.pct}%
                      </span>
                    </td>
                    <td className="is-num tabular">{inr(r.balance)}</td>
                    <td className="is-num">
                      {canAdd && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Plus}
                          onClick={() => setAdding({ projectId: r.projectId })}
                          aria-label={`Add amount for ${r.name}`}
                        />
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="cl-entries">
                      <td colSpan={7}>
                        {r.entries.length ? (
                          <ul>
                            {r.entries.map((e) => (
                              <li key={e.id}>
                                <span className="cl-date">{fmt(e.received_on)}</span>
                                <span className={`cl-type is-${e.type.toLowerCase()}`}>
                                  {TYPE[e.type]}
                                </span>
                                <strong className="tabular">{inr(e.amount)}</strong>
                                <span className="cl-note">{e.note || ''}</span>
                                <span className="cc-muted">{e.created_by_name || ''}</span>
                                {canAdd && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => del(e)}
                                    aria-label="Remove entry"
                                  />
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="cc-muted" style={{ margin: 0 }}>
                            Nothing collected yet.
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
      {adding && (
        <AddAmountModal
          projects={data?.rows || []}
          projectId={adding.projectId}
          onClose={() => setAdding(null)}
        />
      )}
    </div>
  );
}

// Document page actions (replaces the old "Record context" card):
// Version (opens revisions & reviews) · Edit · Delete — one slim bar under the
// page title. Lists only show S.No / Project / Date / Review; editing and
// deleting happen here, on the document itself.
//
// Edit / Delete come from DOC_ACTIONS below. A page that already has its own
// Edit or Delete button is listed with `edit: false` / `del: false` so the
// action never appears twice.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { History, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/inos';
import { appConfirm } from '@/lib/app-dialog';
import { HistoryDrawer } from '@/components/doc-list/review';
import { useGetDocCapabilitiesQuery } from '@/api/doc-flow/doc-flow.api';
import { useDeletePaymentScheduleMutation } from '@/api/documents/payment-schedules.api';
import { useDeletePlannerMutation } from '@/api/documents/project-planner.api';
import { useDeleteBudgetGuideMutation } from '@/api/documents/budget-guides.api';
import { useDeleteBoqMutation } from '@/api/boq/boq.api';
import { useDeletePurchaseOrderMutation } from '@/api/procuerment/purchase-order.api';
import { useDeleteDeliveryChallanMutation } from '@/api/procuerment/delivery-challan.api';
import { docCode, docMeta } from './codes';
import { currentVersion, useRecordContext, versionLabel } from './useRecordInfo';
import './record-context.css';

const useNone = () => [null, { isLoading: false }];

/** edit: path builder or false · del: delete-mutation hook or false.
 *  `false` = the document page already has that button (checked page by page). */
const DOC_ACTIONS = {
  'client-brief': { edit: false, del: false },
  'site-recce': { edit: false, del: false },
  'scope-of-work': { edit: false, del: false },
  'plan-of-action': { edit: false, del: false },
  'payment-schedule': { edit: false, del: useDeletePaymentScheduleMutation },
  // The planner page is its own editor.
  'project-planner': { edit: false, del: useDeletePlannerMutation },
  // Budget guide page has "Edit guide"; delete needs the revision (deleteArg).
  'budget-guide': { edit: false, del: useDeleteBudgetGuideMutation },
  // The comparison page is its own editor and has Delete.
  'vendor-comparison': { edit: false, del: false },
  boq: { edit: false, del: useDeleteBoqMutation },
  'purchase-order': { edit: false, del: useDeletePurchaseOrderMutation },
  'delivery-challan': { edit: false, del: useDeleteDeliveryChallanMutation },
  checklist: {
    edit: (id, ctx) =>
      `/site-operations/checklists/workspace?${new URLSearchParams({ projectId: ctx?.project?.id || '', checklistId: id })}`,
    del: false,
  },
  // These pages already carry their own Edit and Delete buttons.
  'procurement-sheet': { edit: false, del: false },
  'work-order': { edit: false, del: false },
  quotation: { edit: false, del: false },
  'snag-list': { edit: false, del: false },
  'daily-site-report': { edit: false, del: false },
  'admin-dpr': { edit: false, del: false },
  'business-proposal': { edit: false, del: false },
  document: { edit: false, del: false },
  drawing: { edit: false, del: false },
};

const RANK = { none: 0, view: 1, edit: 2, create: 3, full: 4 };

export default function RecordContext({ type, id, listTo, actions, deleteArg, onDeleted }) {
  const nav = useNavigate();
  const { ctx, reviews } = useRecordContext(type, id);
  const { data: caps } = useGetDocCapabilitiesQuery(type, { skip: !type });
  const cfg = DOC_ACTIONS[type] || {};
  const useDel = cfg.del || useNone;
  const [del, { isLoading: deleting }] = useDel();
  const [history, setHistory] = useState(false);
  if (!type || !id) return null;

  const meta = docMeta(type);
  const level = RANK[caps?.level ?? 'view'] ?? 1;
  const canEdit = !!cfg.edit && level >= RANK.edit;
  const canDelete = !!del && level >= RANK.full;
  const name = ctx ? docCode(type, ctx.number, ctx.project?.code) || meta.label : meta.label;

  const remove = async () => {
    if (!(await appConfirm(`Delete ${name}? This cannot be undone.`))) return;
    try {
      await del(deleteArg ?? id).unwrap();
      toast.success(`${meta.label} deleted`);
      if (onDeleted) onDeleted();
      else nav(listTo ?? meta.list ?? '/projects');
    } catch (e) {
      toast.error(e?.data?.message || e?.message || 'Delete failed');
    }
  };

  return (
    <div className="rc-bar" data-testid="record-context">
      <button
        type="button"
        className="rc-version"
        onClick={() => setHistory(true)}
        title="Versions and review history"
        data-testid="rc-version"
      >
        <History aria-hidden size={14} />
        Version {versionLabel(ctx, reviews)}
      </button>
      <span className="rc-bar__spacer" />
      {actions}
      {canEdit && (
        <Button
          variant="secondary"
          size="sm"
          icon={Pencil}
          onClick={() => nav(cfg.edit(id, ctx))}
          data-testid="rc-edit"
        >
          Edit
        </Button>
      )}
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          icon={Trash2}
          loading={deleting}
          onClick={remove}
          data-testid="rc-delete"
        >
          Delete
        </Button>
      )}
      {history && (
        <HistoryDrawer
          type={type}
          id={id}
          name={name}
          version={currentVersion(ctx, reviews)}
          canReview={!!reviews?.canReview}
          initialTab="revisions"
          onClose={() => setHistory(false)}
        />
      )}
    </div>
  );
}

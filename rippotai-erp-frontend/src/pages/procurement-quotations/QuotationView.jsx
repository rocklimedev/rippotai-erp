// Build › Procurement › Quotation — one quotation: the QUOTATION TEMPLATE sheet (PDF / Excel),
// status, versions, and the one-click Raise PO (material vendor) / Raise WO (labour vendor).
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Pencil,
  Send,
  ShoppingCart,
  Trash2,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Button, Card, EmptyState, Page, PageHeader, Pill } from '@/components/inos';
import { DocumentPreview, usePdfDownload } from '@/components/print-document';
import QuotationDocument from '@/components/commerce-documents/QuotationDocument';
import {
  quotationFileName,
  quotationSheetModel,
} from '@/components/quotation-documents/quotationModel';
import { appConfirm } from '@/lib/app-dialog';
import RecordContext from '@/components/record-context/RecordContext';
import VersionHistory from '@/components/record-context/VersionHistory';
import { useRecordInfo } from '@/components/record-context/useRecordInfo';
import { downloadXlsx } from '@/lib/xlsxTemplate';
import { usePermission } from '@/hooks/use-permission';
import {
  useDeleteProcurementQuotationMutation,
  useGetProcurementQuotationQuery,
  useGetProcurementQuotationVersionQuery,
  useRaiseQuotationOrderMutation,
  useSetProcurementQuotationStatusMutation,
} from '@/api/procuerment/procurement-quotation.api';

const LIST = '/procurement/quotations';
const err = (e, fallback) => e?.data?.message || fallback;

export default function QuotationView() {
  const { id } = useParams();
  const recordInfo = useRecordInfo('quotation', id);
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const shownVersion = Number(params.get('version')) || null;
  const {
    data: q,
    isLoading,
    isError,
  } = useGetProcurementQuotationQuery(id, { refetchOnMountOrArgChange: true });
  const older = shownVersion && q && shownVersion !== q.version;
  const { data: versionRow } = useGetProcurementQuotationVersionQuery(
    { id, version: shownVersion },
    { skip: !older },
  );

  const canUpdate = usePermission('procurement-quotations', 'update');
  const canDelete = usePermission('procurement-quotations', 'delete');
  const canPo = usePermission('purchase-orders', 'create');
  const canWo = usePermission('work-orders', 'create');

  const [setStatus, { isLoading: statusBusy }] = useSetProcurementQuotationStatusMutation();
  const [raise, { isLoading: raising }] = useRaiseQuotationOrderMutation();
  const [remove, { isLoading: deleting }] = useDeleteProcurementQuotationMutation();

  const shown = older ? versionRow?.snapshot : q;
  const model = useMemo(() => (shown ? quotationSheetModel(shown) : null), [shown]);
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const [excelBusy, setExcelBusy] = useState(false);

  if (isLoading)
    return (
      <Page>
        <PageHeader title="Quotation" />
        <Card>Loading…</Card>
      </Page>
    );
  if (isError || !q)
    return (
      <Page>
        <PageHeader title="Quotation" />
        <Card>
          <EmptyState
            icon={FileText}
            title="Quotation not found"
            action={<Button onClick={() => nav(LIST)}>All quotations</Button>}
          />
        </Card>
      </Page>
    );

  const labour = q.vendor_kind === 'LABOUR';
  const order = labour ? q.work_order : q.purchase_order;
  const orderPath = order
    ? labour
      ? `/procurement/work-order/${order.id}`
      : `/procurement/purchase-orders/${order.id}`
    : null;
  const closed = ['REJECTED', 'CANCELLED'].includes(q.status);
  const canRaise = !order && !closed && (labour ? canWo : canPo) && q.items?.length > 0;

  const changeStatus = async (status, message) => {
    try {
      await setStatus({ id, status }).unwrap();
      toast.success(message);
    } catch (e) {
      toast.error(err(e, 'Could not change the status.'));
    }
  };

  const raiseOrder = async () => {
    try {
      const res = await raise({ id, kind: q.vendor_kind }).unwrap();
      toast.success(
        labour
          ? `Work order ${res.wo_id || ''} raised`
          : `Purchase order ${res.po_number || ''} raised`,
      );
      nav(labour ? `/procurement/work-order/${res.id}` : `/procurement/purchase-orders/${res.id}`);
    } catch (e) {
      toast.error(err(e, 'Could not raise the order.'));
    }
  };

  const downloadExcel = async () => {
    setExcelBusy(true);
    try {
      const [{ buildQuotationWorkbook }, { default: template }] = await Promise.all([
        import('@/components/quotation-documents/quotationExcel'),
        import('@/assets/xlsx-templates/quotation.xlsx?url'),
      ]);
      downloadXlsx(await buildQuotationWorkbook(template, model), quotationFileName(shown, 'xlsx'));
      toast.success('Quotation Excel downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Could not create the Excel file.');
    } finally {
      setExcelBusy(false);
    }
  };

  const del = async () => {
    if (!(await appConfirm(`Delete quotation ${q.quotation_number}? This cannot be undone.`)))
      return;
    try {
      await remove(id).unwrap();
      toast.success('Quotation deleted');
      nav(LIST);
    } catch (e) {
      toast.error(err(e, 'Could not delete the quotation.'));
    }
  };

  const versions = [q.version, ...(q.history || []).map((h) => h.version)];

  return (
    <Page>
      <PageHeader
        crumbs={[{ label: 'Quotation', to: LIST }, { label: q.quotation_number }]}
        title={`${q.quotation_number} · ${q.vendor_name || 'Quotation'}`}
        info={recordInfo}
        actions={
          <>
            {canDelete && !order && (
              <Button variant="ghost" icon={Trash2} loading={deleting} onClick={del}>
                Delete
              </Button>
            )}
            {canUpdate && (
              <Button
                variant="secondary"
                icon={Pencil}
                onClick={() => nav(`${LIST}/${id}/edit`)}
                data-testid="quotation-edit"
              >
                Edit
              </Button>
            )}
            <Button
              variant="secondary"
              icon={FileSpreadsheet}
              loading={excelBusy}
              onClick={downloadExcel}
              data-testid="quotation-excel"
            >
              Excel
            </Button>
            <Button
              variant="secondary"
              icon={Download}
              loading={downloading}
              onClick={() =>
                download(quotationFileName(shown, 'pdf'), {
                  title: `Quotation ${q.quotation_number}`,
                  label: 'quotation',
                })
              }
              data-testid="quotation-pdf"
            >
              PDF
            </Button>
            {orderPath ? (
              <Button
                variant="primary"
                icon={labour ? Wrench : ShoppingCart}
                onClick={() => nav(orderPath)}
                data-testid="quotation-open-order"
              >
                {labour ? `Open ${order.wo_id}` : `Open ${order.po_number}`}
              </Button>
            ) : (
              canRaise && (
                <Button
                  variant="primary"
                  icon={labour ? Wrench : ShoppingCart}
                  loading={raising}
                  onClick={raiseOrder}
                  data-testid="quotation-raise"
                >
                  {labour ? 'Raise WO' : 'Raise PO'}
                </Button>
              )
            )}
          </>
        }
      />
      <RecordContext
        type="quotation"
        id={id}
        actions={
          <Pill tone={labour ? 'peach' : 'info'} dot={false} size="sm">
            {labour ? 'Labour' : 'Material'}
          </Pill>
        }
      />

      <Card>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span className="inos-label" style={{ margin: 0 }}>
              Version
            </span>
            {versions.map((v) => (
              <button
                key={v}
                type="button"
                className={`inos-chip ${(shownVersion || q.version) === v ? 'is-active' : ''}`}
                onClick={() =>
                  setParams(v === q.version ? {} : { version: String(v) }, { replace: true })
                }
                style={{
                  border: '1px solid var(--inos-border, #e5e7eb)',
                  borderRadius: 999,
                  padding: '2px 10px',
                  fontSize: 12,
                  fontWeight: (shownVersion || q.version) === v ? 700 : 500,
                  background: (shownVersion || q.version) === v ? '#0D3D2F' : 'transparent',
                  color: (shownVersion || q.version) === v ? '#fff' : 'inherit',
                }}
              >
                v{v}
                {v === q.version ? ' · current' : ''}
              </button>
            ))}
            {q.comparison && (
              <Link
                to={`/procurement/vendors/rate-comparison/${q.comparison.id}/edit`}
                style={{ fontSize: 13, marginLeft: 8 }}
              >
                {q.comparison.title}
              </Link>
            )}
          </div>
          {canUpdate && !older && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {q.status === 'DRAFT' && (
                <Button
                  size="sm"
                  icon={Send}
                  loading={statusBusy}
                  onClick={() => changeStatus('SUBMITTED', 'Submitted for approval')}
                >
                  Submit
                </Button>
              )}
              {['DRAFT', 'SUBMITTED'].includes(q.status) && (
                <>
                  <Button
                    size="sm"
                    icon={CheckCircle2}
                    loading={statusBusy}
                    onClick={() => changeStatus('APPROVED', 'Quotation approved')}
                    data-testid="quotation-approve"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={XCircle}
                    loading={statusBusy}
                    onClick={() => changeStatus('REJECTED', 'Quotation rejected')}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {model ? (
        <DocumentPreview>
          <QuotationDocument ref={docRef} model={model} />
        </DocumentPreview>
      ) : (
        <Card>Loading version…</Card>
      )}
      <VersionHistory
        type="quotation"
        id={id}
        extraItems={(q.history || []).map((h) => ({
          key: `qv:${h.version}`,
          version: `v${h.version}`,
          label: 'Saved',
          at: h.created_at || h.createdAt,
          href: `${LIST}/${id}?version=${h.version}`,
        }))}
      />
    </Page>
  );
}

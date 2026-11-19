// Vendor Comparison Sheet → finalised vendor per trade (the template's dropdown) →
// "Create Quotation" for each finalised vendor (one live quotation per project + vendor;
// creating again refills it as the next version).
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FileText, Trophy } from 'lucide-react';
import { Button, Card, Pill, SelectInput, StatusPill } from '@/components/inos';
import {
  useCreateQuotationFromComparisonMutation,
  useGetProcurementQuotationsQuery,
} from '@/api/procuerment/procurement-quotation.api';
import { usePermission } from '@/hooks/use-permission';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const asList = (r) => (Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : []);

export default function FinaliseVendorsCard({
  sheetId,
  projectId,
  dirty,
  saving,
  onSave,
  categories,
  vendors,
  categoryTotal,
  finalised,
  onFinalise,
}) {
  const navigate = useNavigate();
  const canCreate = usePermission('procurement-quotations', 'create');
  const [create, { isLoading }] = useCreateQuotationFromComparisonMutation();
  const [busyVendor, setBusyVendor] = useState(null);
  const { data } = useGetProcurementQuotationsQuery({ projectId }, { skip: !projectId });
  const quotations = asList(data).filter((q) => !['REJECTED', 'CANCELLED'].includes(q.status));

  const rows = useMemo(
    () =>
      categories.map((category) => {
        const totals = vendors.map((v) => ({ ...v, total: categoryTotal(category.id, v.id) }));
        const quoted = totals.filter((t) => t.total > 0);
        const lowest = quoted.length ? quoted.reduce((a, b) => (b.total < a.total ? b : a)) : null;
        const picked = totals.find((t) => t.id === String(finalised[category.id] || ''));
        return { category, totals, lowest, picked };
      }),
    [categories, vendors, categoryTotal, finalised],
  );

  const byVendor = vendors
    .map((v) => {
      const trades = rows.filter((r) => r.picked?.id === v.id);
      return {
        ...v,
        trades,
        amount: trades.reduce((s, r) => s + r.picked.total, 0),
        quotation: quotations.find((q) => String(q.vendor_id) === v.id),
      };
    })
    .filter((v) => v.trades.length);

  const createQuotation = async (vendor) => {
    if (!sheetId) {
      toast.error('Save the comparison sheet first.');
      return;
    }
    setBusyVendor(vendor.id);
    try {
      if (dirty && !(await onSave())) return;
      const q = await create({ comparison_id: sheetId, vendor_id: vendor.id }).unwrap();
      toast.success(
        q.refilled
          ? `Quotation ${q.quotation_number} updated to v${q.version}`
          : `Quotation ${q.quotation_number} created`,
      );
      navigate(`/procurement/quotations/${q.id}`);
    } catch (error) {
      toast.error(error?.data?.message || 'Could not create the quotation.');
    } finally {
      setBusyVendor(null);
    }
  };

  return (
    <Card title="Finalise vendor" data-testid="finalise-vendors">
      <div className="inos-table-wrap">
        <table className="inos-table">
          <thead>
            <tr>
              <th>Trade</th>
              <th>Lowest</th>
              <th style={{ minWidth: 220 }}>Finalised vendor</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ category, totals, lowest, picked }) => (
              <tr key={category.id}>
                <td style={{ fontWeight: 600 }}>{category.name}</td>
                <td>
                  {lowest ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Trophy
                        size={14}
                        aria-hidden
                        style={{ color: 'var(--inos-gold, #D9B061)' }}
                      />
                      {lowest.name} · {money(lowest.total)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <SelectInput
                    aria-label={`Finalised vendor for ${category.name}`}
                    value={picked?.id || ''}
                    onChange={(e) => onFinalise(category.id, e.target.value)}
                    placeholder="Pending"
                  >
                    {totals.map((t) => (
                      <option key={t.id} value={t.id} disabled={!(t.total > 0)}>
                        {t.name}
                        {t.total > 0 ? ` · ${money(t.total)}` : ' · not quoted'}
                      </option>
                    ))}
                  </SelectInput>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  {picked ? money(picked.total) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {byVendor.length > 0 && (
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          {byVendor.map((v) => (
            <div
              key={v.id}
              data-testid="finalised-vendor"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 12,
                justifyContent: 'space-between',
                border: '1px solid var(--inos-border, #e5e7eb)',
                borderRadius: 12,
                padding: '10px 14px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: 'var(--inos-muted, #6b7280)' }}>
                  {v.trades.map((t) => t.category.name).join(', ')} · {money(v.amount)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {v.quotation && (
                  <>
                    <Pill tone="brand" dot={false}>
                      {v.quotation.quotation_number} · v{v.quotation.version}
                    </Pill>
                    <StatusPill status={v.quotation.status} size="sm" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/procurement/quotations/${v.quotation.id}`)}
                    >
                      Open
                    </Button>
                  </>
                )}
                {canCreate && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={FileText}
                    data-testid="create-quotation"
                    disabled={saving || isLoading}
                    loading={busyVendor === v.id}
                    onClick={() => createQuotation(v)}
                  >
                    {v.quotation ? 'Update Quotation' : 'Create Quotation'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

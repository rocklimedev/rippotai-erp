// Edit a quotation. Saving creates the next version (v2, v3 …); earlier versions stay viewable.
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, Field, FormActions, FormSection, Page, PageHeader, SelectInput, TextArea, TextInput } from "@/components/inos";
import { lineAmount, quotationTotals } from "@/components/quotation-documents/quotationModel";
import { useGetProcurementQuotationQuery, useUpdateProcurementQuotationMutation } from "@/api/procuerment/procurement-quotation.api";

const LIST = "/procurement/quotations";
const money = (v) => Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const blankLine = () => ({ category_name: "", item_name: "", description: "", unit: "", quantity: "", rate: "", tax_percent: 18, remarks: "" });
const blankStage = () => ({ stage: "", date: "", amount: "", remarks: "" });
const n = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v));

function fromQuotation(q) {
  return {
    vendor_kind: q.vendor_kind,
    quotation_date: q.quotation_date || "",
    valid_until: q.valid_until || "",
    vendor_name: q.vendor_name || "",
    vendor_type: q.vendor_type || "",
    vendor_phone: q.vendor_phone || "",
    vendor_address: q.vendor_address || "",
    project_name: q.project_name || "",
    project_address: q.project_address || "",
    client_name: q.client_name || "",
    terms: q.terms || "",
    notes: q.notes || "",
    payment_terms: (q.payment_terms || []).map((p) => ({ ...blankStage(), ...p, date: p.date || "", amount: p.amount ?? "" })),
    items: (q.items || []).map((i) => ({
      category_name: i.category_name || "",
      item_name: i.item_name || "",
      description: i.description || "",
      unit: i.unit || "",
      quantity: i.quantity,
      rate: i.rate,
      tax_percent: i.tax_percent,
      remarks: i.remarks || "",
      source_item_id: i.source_item_id || undefined,
      material_id: i.material_id || undefined,
    })),
  };
}

export default function QuotationEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: q, isLoading } = useGetProcurementQuotationQuery(id, { refetchOnMountOrArgChange: true });
  const [save, { isLoading: saving }] = useUpdateProcurementQuotationMutation();
  const [edited, setForm] = useState(null);
  // The saved quotation fills the form (refill); edits are kept locally until "Save as vN".
  const form = edited ?? (q ? fromQuotation(q) : null);
  const update = (fn) => setForm((prev) => fn(prev ?? fromQuotation(q)));

  const totals = useMemo(() => quotationTotals((form?.items || []).map((l) => ({ ...l, quantity: n(l.quantity), rate: n(l.rate), tax_percent: n(l.tax_percent) }))), [form]);

  if (isLoading || !form)
    return (
      <Page width="form">
        <PageHeader title="Edit quotation" />
        <Card>Loading…</Card>
      </Page>
    );

  const set = (key) => (e) => update((f) => ({ ...f, [key]: e.target.value }));
  const setLine = (i, key, value) => update((f) => ({ ...f, items: f.items.map((l, k) => (k === i ? { ...l, [key]: value } : l)) }));
  const setStage = (i, key, value) =>
    update((f) => ({ ...f, payment_terms: f.payment_terms.map((p, k) => (k === i ? { ...p, [key]: value } : p)) }));

  const submit = async () => {
    const items = form.items.filter((l) => l.item_name.trim());
    if (!items.length) {
      toast.error("Add at least one line.");
      return;
    }
    try {
      const saved = await save({
        id,
        version: q.version,
        ...form,
        valid_until: form.valid_until || undefined,
        quotation_date: form.quotation_date || undefined,
        items: items.map((l) => ({
          ...l,
          category_name: l.category_name || undefined,
          description: l.description || undefined,
          unit: l.unit || undefined,
          remarks: l.remarks || undefined,
          quantity: n(l.quantity),
          rate: n(l.rate),
          tax_percent: n(l.tax_percent),
        })),
        payment_terms: form.payment_terms
          .filter((p) => p.stage.trim())
          .map((p) => ({ stage: p.stage, date: p.date || undefined, amount: p.amount === "" ? undefined : n(p.amount), remarks: p.remarks || undefined })),
      }).unwrap();
      toast.success(`Saved as version ${saved.version}`);
      nav(`${LIST}/${id}`);
    } catch (e) {
      toast.error(e?.data?.message?.toString?.() || "Could not save the quotation.");
    }
  };

  const cell = { padding: "6px 4px", verticalAlign: "top" };
  return (
    <Page>
      <PageHeader crumbs={[{ label: "Quotation", to: LIST }, { label: q.quotation_number, to: `${LIST}/${id}` }, { label: "Edit" }]} title={`Edit ${q.quotation_number}`} />
      <Card>
        <FormSection step={1} title="Vendor">
          <Field label="Vendor name">
            <TextInput value={form.vendor_name} onChange={set("vendor_name")} />
          </Field>
          <Field label="Vendor type">
            <TextInput value={form.vendor_type} onChange={set("vendor_type")} />
          </Field>
          <Field label="Phone number">
            <TextInput value={form.vendor_phone} onChange={set("vendor_phone")} />
          </Field>
          <Field label="Order type">
            <SelectInput value={form.vendor_kind} onChange={set("vendor_kind")}>
              <option value="MATERIAL">Material — Purchase Order</option>
              <option value="LABOUR">Labour — Work Order</option>
            </SelectInput>
          </Field>
          <Field label="Address" full>
            <TextInput value={form.vendor_address} onChange={set("vendor_address")} />
          </Field>
        </FormSection>
        <FormSection step={2} title="Project">
          <Field label="Project name">
            <TextInput value={form.project_name} onChange={set("project_name")} />
          </Field>
          <Field label="Client">
            <TextInput value={form.client_name} onChange={set("client_name")} />
          </Field>
          <Field label="Project address" full>
            <TextInput value={form.project_address} onChange={set("project_address")} />
          </Field>
          <Field label="Date">
            <TextInput type="date" value={form.quotation_date} onChange={set("quotation_date")} />
          </Field>
          <Field label="Valid until" optional>
            <TextInput type="date" value={form.valid_until} onChange={set("valid_until")} />
          </Field>
        </FormSection>
        <FormSection step={3} title="Lines" columns={1} tick={false}>
          <div className="inos-table-wrap">
            <table className="inos-table" data-testid="quotation-lines">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th style={{ minWidth: 260 }}>Particular</th>
                  <th style={{ width: 80 }}>Unit</th>
                  <th style={{ width: 100 }}>Qty</th>
                  <th style={{ width: 110 }}>Rate (₹)</th>
                  <th style={{ width: 80 }}>GST %</th>
                  <th style={{ width: 120, textAlign: "right" }}>Amount (₹)</th>
                  <th style={{ minWidth: 140 }}>Remarks</th>
                  <th style={{ width: 40 }} aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {form.items.map((l, i) => (
                  <tr key={i}>
                    <td style={cell}>{i + 1}</td>
                    <td style={cell}>
                      <TextInput value={l.item_name} onChange={(e) => setLine(i, "item_name", e.target.value)} placeholder="Item" aria-label={`Item ${i + 1}`} />
                      <TextInput
                        style={{ marginTop: 4 }}
                        value={l.description}
                        onChange={(e) => setLine(i, "description", e.target.value)}
                        placeholder="Description"
                        aria-label={`Description ${i + 1}`}
                      />
                      <TextInput
                        style={{ marginTop: 4 }}
                        value={l.category_name}
                        onChange={(e) => setLine(i, "category_name", e.target.value)}
                        placeholder="Trade"
                        aria-label={`Trade ${i + 1}`}
                      />
                    </td>
                    <td style={cell}>
                      <TextInput value={l.unit} onChange={(e) => setLine(i, "unit", e.target.value)} aria-label={`Unit ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <TextInput type="number" min="0" step="any" value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)} aria-label={`Quantity ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <TextInput type="number" step="any" value={l.rate} onChange={(e) => setLine(i, "rate", e.target.value)} aria-label={`Rate ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <TextInput type="number" min="0" max="100" step="any" value={l.tax_percent} onChange={(e) => setLine(i, "tax_percent", e.target.value)} aria-label={`GST ${i + 1}`} />
                    </td>
                    <td style={{ ...cell, textAlign: "right", fontWeight: 600, paddingTop: 14 }}>{money(lineAmount({ quantity: n(l.quantity), rate: n(l.rate) }))}</td>
                    <td style={cell}>
                      <TextInput value={l.remarks} onChange={(e) => setLine(i, "remarks", e.target.value)} aria-label={`Remarks ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <Button size="sm" variant="ghost" icon={Trash2} aria-label="Remove line" onClick={() => update((f) => ({ ...f, items: f.items.filter((_, k) => k !== i) }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ textAlign: "right", fontWeight: 600 }}>
                    Subtotal
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{money(totals.subtotal)}</td>
                  <td colSpan={2} />
                </tr>
                {totals.taxes.map((t) => (
                  <tr key={t.rate}>
                    <td colSpan={6} style={{ textAlign: "right" }}>
                      GST {t.rate}%
                    </td>
                    <td style={{ textAlign: "right" }}>{money(t.value)}</td>
                    <td colSpan={2} />
                  </tr>
                ))}
                <tr>
                  <td colSpan={6} style={{ textAlign: "right", fontWeight: 700 }}>
                    Grand Total
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700 }}>{money(totals.total)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <div>
            <Button size="sm" icon={Plus} onClick={() => update((f) => ({ ...f, items: [...f.items, blankLine()] }))}>
              Add line
            </Button>
          </div>
        </FormSection>
        <FormSection step={4} title="Payment terms" columns={1} tick={false}>
          <div className="inos-table-wrap">
            <table className="inos-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th style={{ width: 160 }}>Date</th>
                  <th style={{ width: 140 }}>Amount (₹)</th>
                  <th>Remarks</th>
                  <th style={{ width: 40 }} aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {form.payment_terms.map((p, i) => (
                  <tr key={i}>
                    <td style={cell}>
                      <TextInput value={p.stage} onChange={(e) => setStage(i, "stage", e.target.value)} aria-label={`Stage ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <TextInput type="date" value={p.date} onChange={(e) => setStage(i, "date", e.target.value)} aria-label={`Stage date ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <TextInput type="number" min="0" step="any" value={p.amount} onChange={(e) => setStage(i, "amount", e.target.value)} aria-label={`Stage amount ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <TextInput value={p.remarks} onChange={(e) => setStage(i, "remarks", e.target.value)} aria-label={`Stage remarks ${i + 1}`} />
                    </td>
                    <td style={cell}>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        aria-label="Remove stage"
                        onClick={() => update((f) => ({ ...f, payment_terms: f.payment_terms.filter((_, k) => k !== i) }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <Button size="sm" icon={Plus} onClick={() => update((f) => ({ ...f, payment_terms: [...f.payment_terms, blankStage()] }))}>
              Add stage
            </Button>
          </div>
        </FormSection>
        <FormSection step={5} title="Terms & Conditions" columns={1}>
          <Field label="Terms" full>
            <TextArea rows={4} value={form.terms} onChange={set("terms")} />
          </Field>
        </FormSection>
        <FormActions onCancel={() => nav(`${LIST}/${id}`)} submitLabel={`Save as v${q.version + 1}`} submitting={saving} onSubmit={submit} />
      </Card>
    </Page>
  );
}

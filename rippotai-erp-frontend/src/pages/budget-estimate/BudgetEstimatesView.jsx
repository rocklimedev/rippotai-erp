// Budget Estimate — trade-wise costs and the commercial summary, as a clean A4 document on the shared print kit.
import React, { useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Trash2, Download, Lock, Unlock, FileText, Pencil } from "lucide-react";
import { Page, PageHeader, Button, EmptyState, StatusPill } from "@/components/inos";
import {
  PrintDocument, DocumentPreview, Figure, Totals, Note, HtmlTerms, htmlToTerms, usePdfDownload, pdfFileName,
  has, fmtDate, money, num,
} from "@/components/print-document";
import {
  useGetBudgetEstimateQuery,
  useDeleteBudgetEstimateMutation,
  useLockBudgetEstimateMutation,
  useUnlockBudgetEstimateMutation,
} from "../../api/documents/budget-estimates.api";
import { useGetTermsTemplateQuery } from "../../api/meta/terms.api";

const itemAmount = (item) =>
  item?.amount !== null && item?.amount !== undefined ? Number(item.amount) : Number(item?.quantity || 0) * Number(item?.rate || 0);
const pct = (v) => `${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;

export function buildEstimateSections(estimate, termsHtml) {
  const categories = [...(estimate.categories || [])]
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((c) => ({
      ...c,
      items: [...(c.items || [])].filter((i) => !i.hidden).sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    }))
    .filter((c) => c.items.length);
  const catTotal = (c) => c.items.reduce((s, i) => s + itemAmount(i), 0);
  const itemsTotal = categories.reduce((s, c) => s + catTotal(c), 0);
  const subtotal = Number(estimate.subtotal ?? itemsTotal) || itemsTotal;
  const total = Number(estimate.total_amount || 0);
  const misc = [...(estimate.miscellaneous || [])].filter((m) => Number(m.value) > 0 || has(m.name));
  const miscTotal = misc.reduce((s, m) => s + (Number(m.value) || 0), 0);
  const sections = [];

  // 1 — Summary
  const summary = [];
  if (total > 0)
    summary.push(<Figure key="fig" label="Estimated project cost, including taxes" value={total} />);
  if (categories.length)
    summary.push({
      table: {
        label: "Where the budget goes",
        cols: ["Trade", "#Items", "#Share", "#Amount"],
        template: "1fr 16mm 18mm 32mm",
        keepWhole: categories.length <= 12,
        items: categories.map((c) => ({
          key: c.id,
          cells: [c.name, String(c.items.length), subtotal ? pct((catTotal(c) / subtotal) * 100) : "", money(catTotal(c))],
        })),
      },
    });
  if (summary.length) sections.push({ title: "Summary", blocks: summary });

  // 2 — Trade-wise detail
  if (categories.length)
    sections.push({
      title: "Detailed estimate",
      intro: "Quantities are measured from the drawings available today and will be firmed up in the BOQ.",
      blocks: categories.map((c) => ({
        table: {
          heading: c.name,
          cols: ["Item", "#Qty", "Unit", "#Rate", "#Amount"],
          template: "1fr 17mm 11mm 22mm 28mm",
          items: [
            ...c.items.map((i) => ({
              key: i.id,
              cells: [
                {
                  text: i.name || i.title || i.libraryItem?.name || "Item",
                  sub: [i.location && `Location: ${i.location}`, i.detail, i.notes].filter(has).join("\n"),
                },
                has(i.quantity) ? num(i.quantity) : "",
                i.unit || i.libraryItem?.unit || "",
                has(i.rate) ? money(i.rate) : "",
                money(itemAmount(i)),
              ],
            })),
            { key: `${c.id}-t`, variant: "total", cells: [`Total — ${c.name}`, "", "", "", money(catTotal(c))] },
          ],
        },
      })),
    });

  // 3 — Commercial summary
  const miscPct = Number(estimate.misc_percentage || 0);
  const additional = Number(estimate.additional_amount || 0) || miscTotal;
  const lines = [
    { label: "Items subtotal", value: subtotal },
    Number(estimate.misc_amount) > 0 && { label: `Miscellaneous${miscPct ? ` (${pct(miscPct)})` : ""}`, value: Number(estimate.misc_amount) },
    additional > 0 && {
      label: misc.length ? `Additional items (${misc.map((m) => m.name).filter(has).join(", ")})` : "Additional items",
      value: additional,
    },
    Number(estimate.design_amount) > 0 && { label: "Design fee", value: Number(estimate.design_amount) },
    Number(estimate.execution_amount) > 0 && { label: "Execution fee", value: Number(estimate.execution_amount) },
    Number(estimate.supervisor_amount) > 0 && { label: "Site supervision", value: Number(estimate.supervisor_amount) },
    Number(estimate.discount_amount) > 0 && { label: "Discount", value: -Number(estimate.discount_amount) },
    Number(estimate.tax_amount) > 0 && { label: `GST${Number(estimate.tax_percentage) ? ` @ ${pct(estimate.tax_percentage)}` : ""}`, value: Number(estimate.tax_amount) },
    total > 0 && { label: "Estimated total", value: total, grand: true },
  ].filter(Boolean);
  sections.push({
    title: "Commercial summary",
    blocks: [
      <Totals key="t" lines={lines} />,
      {
        keep: (
          <Note key="n">
            This is a budget estimate to guide decisions, not a quotation. Final costs are confirmed once the BOQ is priced and approved.
          </Note>
        ),
      },
    ],
  });

  if (htmlToTerms(termsHtml).length) sections.push({ title: "Terms", blocks: [<HtmlTerms key="terms" html={termsHtml} />] });
  return sections;
}

export default function BudgetEstimateView() {
  const { id } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);
  const { data: estimate, isFetching, isError } = useGetBudgetEstimateQuery(id, { skip: !id });
  const inlineTerms = estimate?.terms_html || estimate?.terms_content_snapshot || estimate?.boq?.terms_html;
  const { data: template } = useGetTermsTemplateQuery(estimate?.terms_template_id, { skip: !estimate?.terms_template_id || !!inlineTerms });
  const termsHtml = inlineTerms || template?.content_html || "";
  const [deleteBudgetEstimate, { isLoading: deleting }] = useDeleteBudgetEstimateMutation();
  const [lockBudgetEstimate, { isLoading: locking }] = useLockBudgetEstimateMutation();
  const [unlockBudgetEstimate, { isLoading: unlocking }] = useUnlockBudgetEstimateMutation();
  const sections = useMemo(() => (estimate ? buildEstimateSections(estimate, termsHtml) : []), [estimate, termsHtml]);

  const crumbs = [{ label: "Ledger", to: "/ledger" }, { label: "Budget estimates", to: "/ledger/budget-estimates/all" }, { label: "Estimate" }];

  const act = async (fn, ok, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return false;
    try {
      await fn(id).unwrap();
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error(e?.data?.detail || e?.data?.message || "Something went wrong");
      return false;
    }
  };

  if (isFetching && !estimate)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Budget estimate" subtitle="Loading…" />
      </Page>
    );
  if (isError || !estimate)
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Budget estimate" />
        <div className="inos-card">
          <EmptyState icon={FileText} title="Budget estimate not found" text="It may have been deleted, or you don't have access to it." />
        </div>
      </Page>
    );

  const project = estimate.project || {};
  const projectName = project.name || "Project";
  const version = estimate.version || 1;
  const date = fmtDate(estimate.estimate_date || estimate.created_at);

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={projectName}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Budget estimate {estimate.estimate_number} · version {version}
            {estimate.status && <StatusPill status={estimate.locked ? "locked" : estimate.status} size="sm" />}
          </span>
        }
        actions={
          <>
            {!estimate.locked && (
              <Button
                variant="ghost"
                icon={Trash2}
                disabled={deleting}
                onClick={async () => {
                  if (await act(deleteBudgetEstimate, "Budget estimate deleted", "Delete this budget estimate? This cannot be undone."))
                    nav("/ledger/budget-estimates/all");
                }}
              >
                Delete
              </Button>
            )}
            {!estimate.locked && (
              <Button variant="secondary" icon={Pencil} onClick={() => nav(`/ledger/forms/budget-estimate/${estimate.id}/edit`)}>
                Edit
              </Button>
            )}
            {estimate.locked ? (
              <Button variant="secondary" icon={Unlock} loading={unlocking} onClick={() => act(unlockBudgetEstimate, "Budget estimate unlocked")}>
                Unlock
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={Lock}
                loading={locking}
                onClick={() => act(lockBudgetEstimate, "Budget estimate locked", "Lock this budget estimate? You will need to unlock it before editing.")}
              >
                Lock
              </Button>
            )}
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => download(pdfFileName("Budget-Estimate", projectName, version), { title: `Budget Estimate — ${projectName}`, label: "budget estimate" })}
            >
              Download PDF
            </Button>
          </>
        }
      />
      <DocumentPreview>
        <PrintDocument
          ref={docRef}
          docType="Budget Estimate"
          title={projectName}
          subtitle="An early, trade-wise view of what the project will cost."
          coverDetails={[
            { label: "Prepared for", value: estimate.client_name },
            { label: "Project", value: projectName },
            { label: "Site", value: estimate.location || project.site_location },
            { label: "Reference no.", value: estimate.estimate_number },
            { label: "Date", value: date, sub: `Version ${version}` },
            { label: "Prepared by", value: estimate.prepared_by || "Rippotai Architecture", sub: estimate.prepared_by ? "Rippotai Architecture" : "" },
          ]}
          preparedFor={estimate.client_name || projectName}
          reference={estimate.estimate_number}
          date={date}
          version={version}
          sections={sections}
        />
      </DocumentPreview>
    </Page>
  );
}

// Bill of Quantities — client / internal / quantity-only / vendor-enquiry copies, and BOQ templates,
// in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Totals, Terms, SignOff, has, fmtDate, humanize } from "../print-document";
import { COMMERCE_CLASS, amountInWords, qty, rs, termsList, totalLines } from "../print-document/commerce";
import { useGetTermsTemplateQuery } from "@/api/meta/terms.api";

export const BOQ_VARIANTS = {
  client: "Client copy",
  internal: "Internal copy",
  quantity_only: "Quantity only",
  vendor_enquiry: "Vendor enquiry",
};

export const boqFileName = (boq, variant = "client", template = false) => {
  const base = template
    ? `BOQ-Template_${String(boq?.name || "template").replace(/[^\w-]+/g, "-")}`
    : `BOQ_${String(boq?.boq_number || `${boq?.project?.name || "boq"}-v${boq?.version || 1}`).replace(/[^\w-]+/g, "-")}`;
  return `${base}${template ? "" : `_${variant.replace(/_/g, "-")}`}.pdf`;
};

const n = (v) => Number(v || 0);
const parseDetail = (d) => {
  if (!d) return {};
  if (typeof d === "object") return d;
  try {
    return JSON.parse(d) || {};
  } catch {
    return {};
  }
};

/**
 * props: boq (BOQ or template), variant ("client" | "internal" | "quantity_only" | "vendor_enquiry"),
 *        template (bool) — render a BOQ template (no project, no totals beyond category subtotals).
 */
const BoqDocument = forwardRef(function BoqDocument({ boq, variant = "client", template = false }, ref) {
  const termsId = !template && !has(boq?.terms_html) ? boq?.terms_template_id : null;
  const { data: termsTpl } = useGetTermsTemplateQuery(termsId, { skip: !termsId });
  const hidePrice = variant === "quantity_only" || variant === "vendor_enquiry";

  const sections = useMemo(() => {
    if (!boq) return [];
    const cats = [...(boq.categories || [])]
      .sort((a, b) => n(a.sort_order) - n(b.sort_order))
      .map((c) => ({
        ...c,
        items: [...(c.items || [])]
          .filter((i) => !(variant === "client" && i.hidden))
          .sort((a, b) => n(a.sort_order) - n(b.sort_order)),
      }))
      .filter((c) => c.items.length);

    const amountOf = (i) => (has(i.amount) ? n(i.amount) : n(i.quantity) * n(i.rate));
    const cols = hidePrice ? ["No.", "Item", "Unit", "#Qty"] : ["No.", "Item", "Unit", "#Qty", "#Rate", "#Amount"];
    const template_ = hidePrice ? "9mm 1fr 14mm 24mm" : "9mm 1fr 12mm 18mm 22mm 27mm";
    let sno = 0;
    // One table per category (label = category) so headers repeat and subtotals close each group.
    const tables = cats.map((c) => {
      const rows = c.items.map((i) => {
        sno += 1;
        const d = parseDetail(i.detail);
        return {
          key: i.id,
          cells: [
            { text: String(sno), strong: false },
            { text: i.name || i.notes, sub: [i.name ? i.notes : "", i.location, d.brand, d.spec].filter(has).join(" · "), strong: true },
            String(i.unit || "").toLowerCase(),
            qty(i.quantity),
            ...(hidePrice ? [] : [rs(i.rate), rs(amountOf(i))]),
          ],
        };
      });
      if (!hidePrice) {
        const sub = has(c.subtotal) && variant !== "client" ? n(c.subtotal) : c.items.reduce((s, i) => s + amountOf(i), 0);
        rows.push({
          key: `s-${c.id}`,
          variant: "total",
          cells: [{ text: "", strong: false }, { text: `${c.name} subtotal`, strong: true }, ...Array(cols.length - 3).fill(""), rs(sub)],
        });
      }
      return { table: { heading: c.name, cols, template: template_, items: rows, allowSplit: rows.length >= 3 } };
    });

    const misc = [...(boq.miscellaneous || [])].filter((m) => n(m.value));
    const projectTotal = template ? n(boq.total_value) : n(boq.project_total);
    const finalTotal = template ? n(boq.total_value) : n(boq.final_total);
    const summary =
      hidePrice || template
        ? []
        : [
            { label: "Project total", value: projectTotal, always: true },
            ...(misc.length
              ? misc.map((m) => ({ label: m.name, value: n(m.value), muted: true }))
              : [{ label: `Miscellaneous${n(boq.misc_pct) ? ` @ ${n(boq.misc_pct)}%` : ""}`, value: n(boq.misc_amount) }]),
            { label: "Final total", value: finalTotal, grand: true },
          ];

    const terms = termsList(boq.terms_html || termsTpl?.content_html || termsTpl?.data?.content_html);
    const summarySection = template
      ? hidePrice
        ? []
        : [<Totals key="t" decimals={2} lines={[{ label: "Template value", value: finalTotal, grand: true }]} />]
      : [
          summary.length ? { keep: <Totals key="t" decimals={2} lines={totalLines(summary)} words={amountInWords(finalTotal)} /> } : null,
          variant === "internal" ? (
            <KV
              key="fees"
              cols={3}
              items={[
                { label: "Design amount", value: n(boq.design_amount) ? rs(boq.design_amount) : "" },
                { label: "Execution amount", value: n(boq.execution_amount) ? rs(boq.execution_amount) : "" },
                { label: "Supervision amount", value: n(boq.supervisor_amount) ? rs(boq.supervisor_amount) : "" },
              ]}
            />
          ) : null,
        ];

    return [
      template
        ? {
            title: "About this template",
            blocks: [
              <KV
                key="kv"
                cols={3}
                items={[
                  { label: "Template", value: boq.name, strong: true },
                  { label: "Tier", value: humanize(boq.template_tier) },
                  { label: "Categories", value: String(cats.length) },
                  { label: "Description", value: boq.description, wide: true },
                ]}
              />,
            ],
          }
        : {
            title: "Summary",
            blocks: [
              <KV
                key="kv"
                cols={3}
                items={[
                  { label: "Client", value: boq.client_name || boq.project?.client?.name, strong: true },
                  { label: "Project", value: boq.project?.name || boq.title },
                  { label: "Location", value: boq.location || boq.project?.site_location },
                  { label: "BOQ no.", value: boq.boq_number },
                  { label: "Date", value: fmtDate(boq.date || boq.updated_at) },
                  { label: "Prepared by", value: boq.prepared_by || boq.creator?.name },
                  { label: "Copy", value: BOQ_VARIANTS[variant] },
                  { label: "Line items", value: String(sno) },
                  { label: "Categories", value: String(cats.length) },
                ]}
              />,
            ],
          },
      {
        title: template ? "Items" : "Bill of quantities",
        intro: hidePrice ? "Quantities only — please quote your rates against each line." : "",
        blocks: [...tables, ...summarySection],
      },
      { title: "Terms & conditions", blocks: template ? [] : [<Terms key="t" items={terms} />] },
      template
        ? null
        : {
            title: variant === "vendor_enquiry" ? "Vendor quote" : "Approval",
            blocks: [
              <SignOff
                key="s"
                left={{ name: boq.prepared_by || "Rippotai Architecture", role: "Prepared by" }}
                right={
                  variant === "vendor_enquiry"
                    ? { name: "Vendor", role: "Signature & stamp · Date" }
                    : { name: boq.client_name || boq.project?.client?.name || "Client", role: "Approved by · Date" }
                }
              />,
            ],
          },
    ];
  }, [boq, variant, template, hidePrice, termsTpl]);

  if (!boq) return null;
  const projectName = template ? boq.name : boq.project?.name || boq.title;
  const client = boq.client_name || boq.project?.client?.name;
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType={template ? "BOQ Template" : "Bill of Quantities"}
      title={projectName}
      subtitle={template ? humanize(boq.template_tier) : variant === "client" ? "" : BOQ_VARIANTS[variant]}
      coverDetails={
        template
          ? [
              { label: "Template", value: boq.name },
              { label: "Tier", value: humanize(boq.template_tier) },
              { label: "Value", value: hidePrice ? "" : rs(boq.total_value) },
            ]
          : [
              { label: "Prepared for", value: client },
              { label: "Project", value: boq.project?.name || boq.title },
              { label: "Location", value: boq.location || boq.project?.site_location },
              { label: "BOQ no.", value: boq.boq_number, sub: `Version ${boq.version || 1}` },
              { label: "Date", value: fmtDate(boq.date || boq.updated_at) },
              { label: hidePrice ? "Prepared by" : "Final total", value: hidePrice ? boq.prepared_by : rs(boq.final_total), sub: hidePrice ? "" : boq.prepared_by ? `Prepared by ${boq.prepared_by}` : "" },
            ]
      }
      preparedFor={template ? "" : client}
      footerNote={template ? "Internal template" : ""}
      reference={template ? "" : boq.boq_number}
      date={template ? "" : fmtDate(boq.date || boq.updated_at, { short: true })}
      version={template ? undefined : boq.version}
      sections={sections}
    />
  );
});

export default BoqDocument;

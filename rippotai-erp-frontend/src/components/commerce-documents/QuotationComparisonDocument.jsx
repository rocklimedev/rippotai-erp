// Quotation comparison — side-by-side vendor quotes for one scope, in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, has, fmtDate, humanize } from "../print-document";
import { COMMERCE_CLASS, rs } from "../print-document/commerce";

export const comparisonFileName = (data) => {
  const q0 = data?.quotations?.[0] || {};
  return `Quotation-Comparison_${String(q0.project_name || "project").replace(/[^\w-]+/g, "-")}${q0.work_category ? `_${String(q0.work_category).replace(/[^\w-]+/g, "-")}` : ""}.pdf`;
};

const n = (v) => Number(v || 0);
const MAX_VENDOR_COLS = 4;
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const QuotationComparisonDocument = forwardRef(function QuotationComparisonDocument({ data }, ref) {
  const quotes = useMemo(() => data?.quotations || [], [data]);
  const q0 = quotes[0] || {};
  const lowest = quotes.find((q) => q.id === data?.lowest_id);

  const sections = useMemo(() => {
    if (!quotes.length) return [];
    const lines = data?.line_items || [];
    const hasDiscount = quotes.some((q) => n(q.subtotals?.discount));
    const hasExtra = quotes.some((q) => n(q.subtotals?.additional_charges));
    const cols = ["Vendor", "#Base", ...(hasDiscount ? ["#Discount"] : []), ...(hasExtra ? ["#Charges"] : []), "#GST", "#Total"];
    const template = ["1fr", "25mm", ...(hasDiscount ? ["22mm"] : []), ...(hasExtra ? ["22mm"] : []), "22mm", "27mm"].join(" ");

    const lineTables = chunk(quotes, MAX_VENDOR_COLS).map((group, gi, all) => {
      const showBoq = lines.some((li) => n(li.boq_rate));
      return {
        table: {
          heading: all.length > 1 ? `Rates — ${group.map((q) => q.vendor_name).join(", ")}` : undefined,
          cols: ["Item", ...(showBoq ? ["#BOQ rate"] : []), ...group.map((q) => `#${q.vendor_name}`)],
          template: ["1fr", ...(showBoq ? ["22mm"] : []), ...group.map(() => "28mm")].join(" "),
          allowSplit: lines.length >= 3,
          items: lines.map((li, i) => {
            const rates = Object.values(li.quotes || {}).map((c) => n(c?.rate)).filter(Boolean);
            const min = rates.length ? Math.min(...rates) : 0;
            return {
              key: `${gi}-${i}`,
              cells: [
                { text: li.description, sub: li.unit, strong: true },
                ...(showBoq ? [n(li.boq_rate) ? rs(li.boq_rate) : ""] : []),
                ...group.map((q) => {
                  const c = li.quotes?.[q.id];
                  if (!c) return "";
                  const best = n(c.rate) === min && min > 0 && rates.length > 1;
                  return { text: rs(c.rate), sub: best ? "Lowest" : "", strong: best };
                }),
              ],
            };
          }),
        },
      };
    });

    return [
      {
        title: "Overview",
        blocks: [
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "Project", value: q0.project_name, strong: true },
              { label: "Client", value: q0.client_name },
              { label: "Work category", value: q0.work_category || q0.business_type },
              { label: "Quotations compared", value: String(quotes.length) },
              { label: "Lowest total", value: lowest ? `${lowest.vendor_name} · ${rs(lowest.subtotals?.total)}` : "", wide: true },
            ]}
          />,
        ],
      },
      {
        title: "Totals by vendor",
        rows: {
          cols,
          template,
          items: quotes.map((q) => ({
            key: q.id,
            cells: [
              {
                text: q.vendor_name,
                sub: [
                  q.quotation_number,
                  q.quotation_date ? fmtDate(q.quotation_date, { short: true }) : "",
                  q.business_type,
                  q.id === data?.lowest_id ? "Lowest" : "",
                  q.selected ? "Selected" : "",
                ]
                  .filter(has)
                  .join(" · "),
                strong: true,
              },
              rs(q.subtotals?.base),
              ...(hasDiscount ? [n(q.subtotals?.discount) ? `− ${rs(q.subtotals.discount)}` : ""] : []),
              ...(hasExtra ? [n(q.subtotals?.additional_charges) ? rs(q.subtotals.additional_charges) : ""] : []),
              rs(q.subtotals?.tax),
              { text: rs(q.subtotals?.total), strong: true },
            ],
          })),
        },
      },
      { title: "Line item rates", blocks: lines.length ? lineTables : [] },
      {
        title: "Commercial terms",
        blocks: [
          <KV
            key="terms"
            cols={1}
            items={quotes.map((q) => ({ label: q.vendor_name, value: q.commercial_terms }))}
          />,
        ].filter(() => quotes.some((q) => has(q.commercial_terms))),
      },
    ];
  }, [data, quotes, q0, lowest]);

  if (!quotes.length) return null;
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Quotation Comparison"
      title={q0.project_name}
      subtitle={[q0.work_category || q0.business_type, `${quotes.length} quotations`].filter(has).join(" · ")}
      coverDetails={[
        { label: "Prepared for", value: q0.client_name },
        { label: "Project", value: q0.project_name, sub: q0.project_type },
        { label: "Scope", value: q0.work_category || q0.business_type || humanize(q0.vendor_category) },
        { label: "Vendors", value: quotes.map((q) => q.vendor_name).join(", ") },
        { label: "Lowest", value: lowest?.vendor_name, sub: lowest ? rs(lowest.subtotals?.total) : "" },
        { label: "Date", value: fmtDate(new Date().toISOString().slice(0, 10)) },
      ]}
      preparedFor={q0.client_name}
      date={fmtDate(new Date().toISOString().slice(0, 10), { short: true })}
      sections={sections}
    />
  );
});

export default QuotationComparisonDocument;

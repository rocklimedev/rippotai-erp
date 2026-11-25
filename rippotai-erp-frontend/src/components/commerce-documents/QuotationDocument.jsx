// Quotation — finalised vendor's quotation, in the shared Rippotai print format (same as PO / WO).
// Content = the QUOTATION TEMPLATE fields only; the layout is the INOS commerce format (compact, no cover).
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Totals, Terms, SignOff, has, fmtDate } from "../print-document";
import { COMMERCE_CLASS, fmtPhone, qty, rs } from "../print-document/commerce";

// Exactly the QUOTATION TEMPLATE fields: Date · Vendor name / type / phone / address ·
// Project name / address · S.No / Particular / Rate / Quantity / Amount / Remarks ·
// Subtotal / Grand total · Payment terms (Stages / Date / Amount / Remarks) ·
// Terms & conditions · Approved by / Contractor's signature. No cover page.
const COLS = ["S.No", "Particular", "#Rate (₹)", "#Quantity", "#Amount (₹)", "Remarks"];
const TEMPLATE = "10mm 1fr 20mm 22mm 25mm 26mm";

const QuotationDocument = forwardRef(function QuotationDocument({ model }, ref) {
  const sections = useMemo(() => {
    if (!model) return [];
    const items = model.rows.filter((r) => r.type === "item");
    const subtotal = model.totals.find((t) => t.key === "subtotal")?.value ?? items.reduce((s, r) => s + Number(r.amount || 0), 0);
    const out = [
      {
        title: "Quotation",
        unnumbered: true,
        blocks: [
          <KV
            key="kv"
            cols={2}
            items={[
              { label: "Vendor name", value: model.vendor.name || " ", strong: true },
              { label: "Project name", value: model.project.name || " ", strong: true },
              { label: "Vendor type", value: model.vendor.type || " " },
              { label: "Project address", value: model.project.address || " " },
              { label: "Phone number", value: fmtPhone(model.vendor.phone) || " " },
              { label: "Date", value: fmtDate(model.date) || " " },
              { label: "Address", value: model.vendor.address || " " },
            ]}
          />,
        ],
      },
      {
        title: "Particulars",
        unnumbered: true,
        blocks: [
          {
            table: {
              cols: COLS,
              template: TEMPLATE,
              items: items.map((it, i) => ({
                key: it.id || i,
                cells: [
                  { text: String(i + 1), strong: false },
                  { text: it.particular, sub: it.detail, strong: true },
                  rs(it.rate),
                  it.quantity == null ? "" : [qty(it.quantity), String(it.unit || "").toLowerCase()].filter(has).join(" "),
                  rs(it.amount),
                  it.remarks || "",
                ],
              })),
            },
          },
          {
            keep: (
              <Totals
                key="t"
                decimals={2}
                lines={[
                  { label: "Subtotal", value: subtotal },
                  { label: "Grand total", value: model.grandTotal, grand: true },
                ]}
              />
            ),
          },
        ],
      },
    ];
    if (model.payment?.length)
      out.push({
        title: "Payment terms",
        unnumbered: true,
        blocks: [
          {
            table: {
              cols: ["Stages", "Date", "#Amount (₹)", "Remarks"],
              template: "1fr 28mm 30mm 50mm",
              items: model.payment.map((p, i) => ({
                key: i,
                cells: [{ text: p.stage, strong: true }, p.date ? fmtDate(p.date) : "", has(p.amount) ? rs(p.amount) : "", p.remarks || ""],
              })),
            },
          },
        ],
      });
    out.push(
      { title: "Terms & conditions", unnumbered: true, blocks: [<Terms key="t" items={model.terms} />] },
      {
        title: "Signatures",
        unnumbered: true,
        blocks: [
          <SignOff
            key="s"
            left={{ name: model.approvedBy?.name || " ", role: ["Approved by", model.approvedBy?.date ? fmtDate(model.approvedBy.date) : ""].filter(has).join(" · ") }}
            right={{ name: model.vendor.name || " ", role: "Contractor's signature" }}
          />,
        ],
      },
    );
    return out;
  }, [model]);

  if (!model) return null;
  return (
    <PrintDocument
      ref={ref}
      className={`${COMMERCE_CLASS} pd-doc--compact`}
      docType="Quotation"
      title={model.project.name || "Quotation"}
      date={fmtDate(model.date, { short: true })}
      sections={sections}
      numbered={false}
      noCover
    />
  );
});

export default QuotationDocument;

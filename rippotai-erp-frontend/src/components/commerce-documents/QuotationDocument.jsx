// Quotation — finalised vendor's quotation, in the shared Rippotai print format (same as PO / WO).
// Content comes from quotationSheetModel (QUOTATION TEMPLATE fields); the layout is the INOS commerce format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Totals, Terms, SignOff, has, fmtDate } from "../print-document";
import { COMMERCE_CLASS, Parties, companyParty, useCompanyProfile, fmtPhone, amountInWords, qty, rs, totalLines } from "../print-document/commerce";
import { groupedItemTables } from "./PurchaseOrderDocument";

const COLS = ["No.", "Particular", "#Qty", "Unit", "#Rate", "#Amount", "Remarks"];
const TEMPLATE = "8mm 1fr 15mm 11mm 21mm 25mm 30mm";

const QuotationDocument = forwardRef(function QuotationDocument({ model }, ref) {
  const company = useCompanyProfile();

  const sections = useMemo(() => {
    if (!model) return [];
    const items = model.rows.filter((r) => r.type === "item");
    let category = "";
    const withCat = [];
    model.rows.forEach((r) => {
      if (r.type === "category") category = r.name;
      else withCat.push({ ...r, category });
    });
    const tables = groupedItemTables(withCat, {
      cols: COLS,
      template: TEMPLATE,
      category: (it) => it.category,
      amount: (it) => it.amount,
      cells: (it, n) => [
        { text: String(n), strong: false },
        { text: it.particular, sub: it.detail, strong: true },
        it.quantity == null ? "" : qty(it.quantity),
        String(it.unit || "").toLowerCase(),
        rs(it.rate),
        rs(it.amount),
        it.remarks || "",
      ],
    });
    const subtotal = model.totals.find((t) => t.key === "subtotal")?.value || 0;
    const out = [
      {
        title: "Quotation details",
        blocks: [
          <Parties
            key="p"
            parties={[
              companyParty(company, "Issued by"),
              {
                title: "Vendor",
                name: model.vendor.name,
                lines: [model.vendor.address],
                items: [
                  { label: "Type", value: model.vendor.type },
                  { label: "Phone", value: fmtPhone(model.vendor.phone) },
                ],
              },
              {
                title: "Project",
                name: model.project.name,
                lines: [model.project.address],
                items: [{ label: "Client", value: model.project.client }],
              },
            ]}
          />,
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "Quotation no.", value: model.number, strong: true },
              { label: "Date", value: fmtDate(model.date) },
              { label: "Version", value: model.version > 1 ? `v${model.version}` : "v1" },
            ]}
          />,
        ],
      },
      {
        title: "Items",
        blocks: [
          ...(items.length ? tables : []),
          {
            keep: (
              <Totals
                key="t"
                decimals={2}
                words={amountInWords(model.grandTotal)}
                lines={totalLines([
                  { label: "Subtotal", value: subtotal, always: true },
                  ...model.totals.filter((t) => t.key !== "subtotal").map((t) => ({ label: t.label, value: t.value })),
                  { label: "Grand total", value: model.grandTotal, grand: true },
                ])}
              />
            ),
          },
        ],
      },
    ];
    if (model.payment?.length)
      out.push({
        title: "Payment terms",
        blocks: [
          {
            table: {
              cols: ["No.", "Stage", "Date", "#Amount", "Remarks"],
              template: "8mm 1fr 26mm 28mm 40mm",
              items: model.payment.map((p, i) => ({
                key: i,
                cells: [String(i + 1), { text: p.stage, strong: true }, p.date ? fmtDate(p.date) : "", has(p.amount) ? rs(p.amount) : "", p.remarks || ""],
              })),
            },
          },
        ],
      });
    out.push(
      { title: "Terms & conditions", blocks: [<Terms key="t" items={model.terms} />] },
      {
        title: "Authorisation",
        blocks: [
          <SignOff
            key="s"
            left={{ name: model.approvedBy?.name || company.name, role: model.approvedBy ? `Approved · ${fmtDate(model.approvedBy.date)}` : "Authorised signatory" }}
            right={{ name: model.vendor.name || "Vendor", role: "Accepted · signature & stamp" }}
          />,
        ],
      },
    );
    return out;
  }, [model, company]);

  if (!model) return null;
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Quotation"
      title={model.project.name || "Quotation"}
      subtitle={model.vendor.name}
      coverDetails={[
        { label: "Vendor", value: model.vendor.name, sub: model.vendor.type },
        { label: "Project", value: model.project.name, sub: model.project.client },
        { label: "Site", value: model.project.address },
        { label: "Quotation no.", value: model.number, sub: model.version > 1 ? `Version ${model.version}` : "" },
        { label: "Date", value: fmtDate(model.date) },
        { label: "Quotation value", value: rs(model.grandTotal) },
      ]}
      preparedFor={model.vendor.name}
      reference={model.number}
      date={fmtDate(model.date, { short: true })}
      sections={sections}
    />
  );
});

export default QuotationDocument;

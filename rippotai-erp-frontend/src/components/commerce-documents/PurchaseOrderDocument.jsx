// Purchase Order — Rippotai → vendor, in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Totals, Terms, SignOff, has, fmtDate, humanize } from "../print-document";
import {
  COMMERCE_CLASS, Parties, companyParty, useCompanyProfile, fmtPhone,
  amountInWords, qty, rs, termsList, totalLines,
} from "../print-document/commerce";

// Standard PO conditions (printed on every Rippotai PO), followed by any PO-specific terms.
export const PO_STANDARD_TERMS = [
  "This PO is issued only against an approved BOQ line or an accepted Quotation.",
  "Material must match the approved sample / specification exactly — brand, batch and grade.",
  "Delivery only against this PO number; unannounced deliveries may be refused at site.",
  "Invoice must reference this PO number and be accompanied by the signed Delivery Challan.",
  "Any variation in rate, quantity or specification requires written approval before dispatch.",
];

export const purchaseOrderFileName = (po) =>
  `Purchase-Order_${String(po?.po_number || "draft").replace(/[^\w-]+/g, "-")}.pdf`;

const COLS = ["No.", "Description of material", "HSN", "#Qty", "Unit", "#Rate", "#Amount"];
const TEMPLATE = "8mm 1fr 13mm 17mm 11mm 21mm 25mm";

/**
 * Item tables: one table when all items share a category, otherwise one table per category
 * (category as the table label, closing subtotal row) so headers repeat on every page.
 */
export function groupedItemTables(items, { category, cells, amount, cols, template }) {
  const cats = [];
  const byCat = new Map();
  items.forEach((it) => {
    const c = category(it) || "Other";
    if (!byCat.has(c)) {
      byCat.set(c, []);
      cats.push(c);
    }
    byCat.get(c).push(it);
  });
  let n = 0;
  if (cats.length < 2) return [{ table: { cols, template, items: items.map((it, i) => ({ key: it.id || i, cells: cells(it, ++n) })) } }];
  return cats.map((c) => {
    const list = byCat.get(c);
    const rows = list.map((it, i) => ({ key: it.id || `${c}-${i}`, cells: cells(it, ++n) }));
    const sub = list.reduce((s, it) => s + Number(amount(it) || 0), 0);
    rows.push({
      key: `s-${c}`,
      variant: "total",
      cells: [{ text: "", strong: false }, { text: `${c} subtotal`, strong: true }, ...Array(cols.length - 3).fill(""), rs(sub)],
    });
    return { table: { heading: c, cols, template, items: rows, allowSplit: rows.length >= 3 } };
  });
}

const PurchaseOrderDocument = forwardRef(function PurchaseOrderDocument({ po, project }, ref) {
  const company = useCompanyProfile();
  const proj = project || po?.project || {};

  const sections = useMemo(() => {
    if (!po) return [];
    const items = [...(po.items || [])].sort((a, b) => Number(a.line_number || 0) - Number(b.line_number || 0));
    const subtotal = Number(po.subtotal ?? items.reduce((s, i) => s + Number(i.amount || 0), 0));
    const discount = Number(po.discount || 0);
    const gstPct = Number(po.gst_percent || 0);
    const gst = Number(po.gst_amount ?? ((subtotal - discount) * gstPct) / 100);
    const cartage = Number(po.cartage || 0);
    const total = Number(po.total_amount ?? subtotal - discount + gst + cartage);

    const hasHsn = items.some((it) => has(it.material?.hsn_code));
    const cols = hasHsn ? COLS : COLS.filter((c) => c !== "HSN");
    const template = hasHsn ? TEMPLATE : "8mm 1fr 17mm 11mm 21mm 25mm";
    const tables = groupedItemTables(items, {
      cols,
      template,
      category: (it) => it.material?.category,
      amount: (it) => it.amount ?? Number(it.ordered_quantity || 0) * Number(it.rate || 0),
      cells: (it, n) => [
        { text: String(n), strong: false },
        {
          text: it.description || it.material?.name,
          sub: [it.brand, it.specification, it.remarks].filter(has).join(" · "),
          strong: true,
        },
        ...(hasHsn ? [it.material?.hsn_code || ""] : []),
        qty(it.ordered_quantity ?? it.quantity),
        String(it.unit || it.material?.unit?.code || "").toLowerCase(),
        rs(it.rate),
        rs(it.amount ?? Number(it.ordered_quantity || 0) * Number(it.rate || 0)),
      ],
    });

    return [
      {
        title: "Order details",
        blocks: [
          <Parties
            key="p"
            parties={[
              companyParty(company, "Buyer"),
              {
                title: "Vendor",
                name: po.agency_name || po.vendor?.name,
                lines: [po.vendor?.address],
                items: [
                  { label: "Contact", value: po.contact_person },
                  { label: "Phone", value: fmtPhone(po.phone) },
                  { label: "Email", value: po.email },
                  { label: "GSTIN", value: po.vendor_gstin },
                  { label: "PAN", value: po.vendor_pan },
                ],
              },
              {
                title: "Ship to",
                name: proj.name,
                lines: [po.ship_to_address || proj.site_location],
                items: [
                  { label: "Contact", value: po.site_contact_person },
                ],
              },
            ]}
          />,
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "PO no.", value: po.po_number, strong: true },
              { label: "PO date", value: fmtDate(po.po_date) },
              { label: "Deliver by", value: fmtDate(po.target_delivery_date) },
              { label: "Against", value: po.source_type && po.source_type !== "MANUAL" ? humanize(po.source_type) : "" },
              { label: "Delivery notes", value: po.notes, wide: true },
            ]}
          />,
        ],
      },
      {
        title: "Materials",
        blocks: [
          ...tables,
          {
            keep: (
              <Totals
                key="t"
                decimals={2}
                words={amountInWords(total)}
                lines={totalLines([
                  { label: "Subtotal", value: subtotal, always: true },
                  { label: "Discount", value: -Math.abs(discount) },
                  discount ? { label: "Taxable value", value: subtotal - discount, muted: true } : null,
                  { label: `GST @ ${gstPct}%`, value: gst },
                  { label: "Cartage", value: cartage },
                  { label: "Grand total", value: total, grand: true },
                ])}
              />
            ),
          },
        ],
      },
      {
        title: "Terms & conditions",
        blocks: [
          <Terms key="t" items={[...PO_STANDARD_TERMS, ...termsList(po.terms_and_conditions)]} />,
        ],
      },
      {
        title: "Authorisation",
        blocks: [
          <SignOff
            key="s"
            left={{ name: company.name, role: "Authorised signatory" }}
            right={{ name: po.agency_name || "Vendor", role: "Accepted · signature & stamp" }}
          />,
        ],
      },
    ];
  }, [po, proj, company]);

  if (!po) return null;
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Purchase Order"
      title={proj.name || "Purchase order"}
      subtitle={po.agency_name}
      coverDetails={[
        { label: "Vendor", value: po.agency_name, sub: po.contact_person },
        { label: "Project", value: proj.name, sub: proj.client?.name },
        { label: "Ship to", value: proj.site_location || po.ship_to_address },
        { label: "PO no.", value: po.po_number },
        { label: "PO date", value: fmtDate(po.po_date), sub: po.target_delivery_date ? `Deliver by ${fmtDate(po.target_delivery_date, { short: true })}` : "" },
        { label: "Order value", value: rs(po.total_amount), sub: Number(po.gst_percent) ? `Incl. GST @ ${Number(po.gst_percent)}%` : "" },
      ]}
      preparedFor={po.agency_name}
      footerNote={has(po.agency_name) ? `Issued to ${po.agency_name}` : ""}
      reference={po.po_number}
      date={fmtDate(po.po_date, { short: true })}
      sections={sections}
    />
  );
});

export default PurchaseOrderDocument;

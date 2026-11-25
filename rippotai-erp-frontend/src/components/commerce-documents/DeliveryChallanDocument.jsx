// Delivery Challan — goods received at site against a PO, in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, SignOff, has, fmtDate } from "../print-document";
import { COMMERCE_CLASS, fmtPhone, qty } from "../print-document/commerce";

export const deliveryChallanFileName = (dc) =>
  `Delivery-Challan_${String(dc?.challan_number || "draft").replace(/[^\w-]+/g, "-")}.pdf`;

const n = (v) => Number(v || 0);
// Blank numbered lines fill the rest of the one A4 sheet so goods can be written in by hand.
const GOODS_SPACE_MM = 124; // table body height left on the sheet after details + signatures
const ROW_MM = 7.5; // one plain line
const ROW_SUB_MM = 12; // a line with brand / specification under it
// dispatched_by / received_by hold user ids — never print a raw id as a signatory name.
const person = (v) => (has(v) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(String(v)) ? v : "");

const DeliveryChallanDocument = forwardRef(function DeliveryChallanDocument(
  { challan: dc, project, vendor, purchaseOrder },
  ref,
) {
  const proj = project || dc?.project || {};
  const ven = vendor || dc?.vendor || {};
  const po = purchaseOrder || dc?.purchase_order || dc?.purchaseOrder || null;

  const sections = useMemo(() => {
    if (!dc) return [];
    const items = [...(dc.items || [])].sort((a, b) => n(a.line_number) - n(b.line_number));
    const issueText = (it) =>
      [
        n(it.shortage_quantity) ? `Short ${qty(it.shortage_quantity)}` : "",
        n(it.damaged_quantity) ? `Damaged ${qty(it.damaged_quantity)}` : "",
        n(it.rejected_quantity) ? `Rejected ${qty(it.rejected_quantity)}` : "",
      ]
        .filter(has)
        .join(" · ");
    const unitOf = (it) => String(it.unit || it.material?.unit?.code || "").toLowerCase();
    // One A4 sheet: header details, then the goods table with blank lines to write in.
    const cols = ["No.", "Description of goods", "Unit", "#Qty sent", "#Qty received", "Remarks"];
    const template = "9mm 1fr 14mm 20mm 22mm 40mm";
    const rows = items.map((it, i) => ({
      key: it.id || i,
      cells: [
        { text: String(i + 1), strong: false },
        {
          text: it.description || it.material?.name,
          sub: [it.brand, it.specification].filter(has).join(" · "),
          strong: true,
        },
        unitOf(it),
        qty(it.quantity),
        has(it.accepted_quantity) ? qty(it.accepted_quantity) : "",
        { text: issueText(it) || it.condition_notes || it.remarks || "", strong: false },
      ],
    }));
    const used = items.reduce((h, it) => h + ([it.brand, it.specification].some(has) ? ROW_SUB_MM : ROW_MM), 0);
    const blanks = Math.max(0, Math.floor((GOODS_SPACE_MM - used) / ROW_MM));
    for (let i = rows.length; i < items.length + blanks; i++)
      rows.push({ key: `blank-${i}`, cells: [{ text: String(i + 1), strong: false }, " ", "", "", "", ""] });

    return [
      {
        title: "Challan",
        unnumbered: true,
        blocks: [
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "Challan no.", value: dc.challan_number || " ", strong: true },
              { label: "Date", value: fmtDate(dc.challan_date) || " " },
              { label: "Against PO", value: po?.po_number || " " },
              { label: "Supplier", value: ven.company_name || ven.name || " ", sub: fmtPhone(ven.contact_number) },
              { label: "Project", value: proj.name || " " },
              { label: "Site address", value: dc.site_address || proj.site_location || " " },
            ]}
          />,
        ],
      },
      {
        title: "Goods",
        unnumbered: true,
        rows: { cols, template, items: rows },
      },
      {
        title: "Remarks & signatures",
        unnumbered: true,
        blocks: [
          <SignOff
            key="s"
            note={[dc.general_remarks, has(dc.discrepancy_notes) ? `Discrepancy: ${dc.discrepancy_notes}` : ""].filter(has).join(" · ") || null}
            left={{
              name: person(dc.dispatched_by) || ven.company_name || ven.name || "Supplier",
              role: ["Dispatched by", dc.dispatched_at ? fmtDate(dc.dispatched_at, { short: true }) : ""].filter(has).join(" · "),
            }}
            right={{
              name: person(dc.received_by) || " ",
              role: ["Received at site", dc.received_at ? fmtDate(dc.received_at, { short: true }) : ""].filter(has).join(" · "),
            }}
          />,
        ],
      },
    ];
  }, [dc, proj, ven, po]);

  if (!dc) return null;
  return (
    <PrintDocument
      ref={ref}
      className={`${COMMERCE_CLASS} pd-doc--compact`}
      docType="Delivery Challan"
      title={proj.name || "Delivery challan"}
      reference={dc.challan_number}
      date={fmtDate(dc.challan_date, { short: true })}
      sections={sections}
      numbered={false}
      noCover
    />
  );
});

export default DeliveryChallanDocument;

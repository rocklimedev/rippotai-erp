// Delivery Challan — goods received at site against a PO, in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, SignOff, has, fmtDate, humanize } from "../print-document";
import { COMMERCE_CLASS, Parties, companyParty, useCompanyProfile, parseTaxIds, fmtPhone, qty } from "../print-document/commerce";

export const deliveryChallanFileName = (dc) =>
  `Delivery-Challan_${String(dc?.challan_number || "draft").replace(/[^\w-]+/g, "-")}.pdf`;

const n = (v) => Number(v || 0);

const DeliveryChallanDocument = forwardRef(function DeliveryChallanDocument(
  { challan: dc, project, vendor, purchaseOrder },
  ref,
) {
  const company = useCompanyProfile();
  const proj = project || dc?.project || {};
  const ven = vendor || dc?.vendor || {};
  const po = purchaseOrder || dc?.purchase_order || dc?.purchaseOrder || null;

  const sections = useMemo(() => {
    if (!dc) return [];
    const items = [...(dc.items || [])].sort((a, b) => n(a.line_number) - n(b.line_number));
    const tax = parseTaxIds(ven.notes);
    const anyReceipt = items.some((it) => has(it.accepted_quantity) && n(it.accepted_quantity) !== n(it.quantity));
    const issueText = (it) =>
      [
        n(it.shortage_quantity) ? `Short ${qty(it.shortage_quantity)}` : "",
        n(it.damaged_quantity) ? `Damaged ${qty(it.damaged_quantity)}` : "",
        n(it.rejected_quantity) ? `Rejected ${qty(it.rejected_quantity)}` : "",
      ]
        .filter(has)
        .join(" · ");
    const showIssues = items.some((it) => has(issueText(it)) || has(it.condition_notes));
    const unitOf = (it) => String(it.unit || it.material?.unit?.code || "").toLowerCase();
    const cols = ["No.", "Description of goods", "Unit", "#Qty", ...(anyReceipt ? ["#Accepted"] : []), ...(showIssues ? ["Remarks"] : [])];
    const template = ["8mm", "1fr", "12mm", "18mm", ...(anyReceipt ? ["20mm"] : []), ...(showIssues ? ["42mm"] : [])].join(" ");

    return [
      {
        title: "Delivery details",
        blocks: [
          <Parties
            key="p"
            parties={[
              {
                title: "Supplier",
                name: ven.company_name || ven.name,
                lines: [ven.address, fmtPhone(ven.contact_number)],
                items: [{ label: "GSTIN", value: ven.gstin || tax.gstin }],
              },
              {
                title: "Delivered to",
                name: proj.name,
                lines: [dc.site_address || proj.site_location],
              },
              companyParty(company, "Consignee"),
            ]}
          />,
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "Challan no.", value: dc.challan_number, strong: true },
              { label: "Challan date", value: fmtDate(dc.challan_date) },
              { label: "Against PO", value: po?.po_number },
              { label: "Status", value: humanize(dc.status) },
              { label: "Gate pass", value: dc.gate_pass_received ? "Received" : "" },
              { label: "Material check", value: dc.material_checked ? "Checked at site" : "" },
            ]}
          />,
        ],
      },
      {
        title: "Goods",
        rows: {
          cols,
          template,
          items: items.map((it, i) => ({
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
              ...(anyReceipt ? [has(it.accepted_quantity) ? qty(it.accepted_quantity) : ""] : []),
              ...(showIssues
                ? [{ text: issueText(it) || it.condition_notes, sub: issueText(it) ? it.condition_notes : "", strong: false }]
                : []),
            ],
          })),
        },
      },
      {
        title: "Remarks",
        blocks: [
          has(dc.general_remarks) ? { text: { value: dc.general_remarks } } : null,
          has(dc.discrepancy_notes) ? { text: { label: "Discrepancy", value: dc.discrepancy_notes } } : null,
        ],
      },
      {
        title: "Acknowledgement",
        blocks: [
          <SignOff
            key="s"
            left={{
              name: dc.dispatched_by || ven.company_name || ven.name || "Supplier",
              role: ["Dispatched by", dc.dispatched_at ? fmtDate(dc.dispatched_at, { short: true }) : ""].filter(has).join(" · "),
            }}
            right={{
              name: dc.received_by || company.name,
              role: ["Received at site", dc.received_at ? fmtDate(dc.received_at, { short: true }) : ""].filter(has).join(" · "),
            }}
          />,
        ],
      },
    ];
  }, [dc, proj, ven, po, company]);

  if (!dc) return null;
  const supplier = ven.company_name || ven.name;
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Delivery Challan"
      title={proj.name || "Delivery challan"}
      subtitle={supplier}
      coverDetails={[
        { label: "Supplier", value: supplier, sub: fmtPhone(ven.contact_number) },
        { label: "Project", value: proj.name, sub: proj.client?.name },
        { label: "Site", value: proj.site_location || dc.site_address },
        { label: "Challan no.", value: dc.challan_number },
        { label: "Date", value: fmtDate(dc.challan_date) },
        { label: "Against PO", value: po?.po_number, sub: (dc.items || []).length ? `${dc.items.length} line item${dc.items.length === 1 ? "" : "s"}` : "" },
      ]}
      preparedFor={proj.name}
      reference={dc.challan_number}
      date={fmtDate(dc.challan_date, { short: true })}
      sections={sections}
    />
  );
});

export default DeliveryChallanDocument;

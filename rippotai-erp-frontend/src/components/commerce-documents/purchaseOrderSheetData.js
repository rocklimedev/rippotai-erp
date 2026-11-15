// Purchase order → data for the PURCHASE ORDER sheet (template-documents/order-sheet.jsx).
import { has } from "../print-document";
import { fmtPhone, qty, termsList } from "../print-document/commerce";
import { sheetDate } from "../template-documents/sheet-utils";

// Standard PO conditions — wording exactly as printed on the template; PO-specific terms follow.
export const PO_STANDARD_TERMS = [
  "This PO is issued only against an approved BOQ line or an accepted Quotation.",
  "Material must match the approved sample / specification exactly — brand, batch and grade.",
  "Delivery only against this PO number; unannounced deliveries may be refused at site.",
  "Invoice must reference this PO number and be accompanied by the signed Delivery Challan.",
  "Any variation in rate, quantity or specification requires written approval before dispatch.",
];

const SOURCE_LABEL = { BOQ: "BOQ", ESTIMATE: "Estimate" };

/** Person shown on a signature line — never a raw user id. */
export const personName = (v) =>
  v && typeof v === "object"
    ? v.name || [v.first_name, v.last_name].filter(has).join(" ")
    : has(v) && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(String(v))
      ? String(v)
      : "";

export function purchaseOrderSheetData(po, project, company) {
  const proj = project || po?.project || {};
  const items = [...(po.items || [])].sort((a, b) => Number(a.line_number || 0) - Number(b.line_number || 0));
  const amountOf = (it) => it.amount ?? Number(it.ordered_quantity || 0) * Number(it.rate || 0);
  const subtotal = Number(po.subtotal ?? items.reduce((s, i) => s + Number(amountOf(i) || 0), 0));
  const discount = Number(po.discount || 0);
  const gstPct = Number(po.gst_percent || 0);
  const gst = Number(po.gst_amount ?? ((subtotal - discount) * gstPct) / 100);
  const cartage = Number(po.cartage || 0);
  const total = Number(po.total_amount ?? subtotal - discount + gst + cartage);
  const source = po.source_type && po.source_type !== "MANUAL" ? SOURCE_LABEL[po.source_type] || po.source_type : "";
  const approved = ["APPROVED", "SENT", "PARTIALLY_RECEIVED", "RECEIVED", "CLOSED"].includes(po.status);

  return {
    title: "PURCHASE ORDER",
    subtitle: "MATERIAL",
    company,
    meta: [
      { label: "PO ID:", value: po.po_number },
      { label: "Date:", value: sheetDate(po.po_date) },
      { label: "Target delivery:", value: sheetDate(po.target_delivery_date) },
    ],
    band: ["VENDOR", "SHIP TO"],
    left: [
      ["AGENCY", po.agency_name || po.vendor?.company_name || po.vendor?.name],
      ["CONTACT PERSON", po.contact_person],
      ["PHONE", fmtPhone(po.phone)],
      ["EMAIL", po.email],
      ["GSTIN", po.vendor_gstin],
      ["PAN", po.vendor_pan],
    ],
    right: [
      ["NAME", proj.name],
      ["SITE ADDRESS", po.ship_to_address || proj.site_location],
      ["CONTACT PERSON", po.site_contact_person],
      ["CONTACT", fmtPhone(po.site_contact_phone)],
    ],
    descHead: "DESCRIPTION OF MATERIAL",
    items: items.map((it) => {
      const desc = it.description || it.material?.name;
      return {
        desc,
        sub: [it.brand, it.specification, it.material?.hsn_code ? `HSN ${it.material.hsn_code}` : "", it.remarks]
          .filter(has)
          .filter((v, i, a) => a.indexOf(v) === i && v !== desc)
          .join(" · "),
        qty: qty(it.ordered_quantity ?? it.quantity),
        unit: String(it.unit || it.material?.unit?.code || "").toLowerCase(),
        rate: it.rate,
        amount: amountOf(it),
      };
    }),
    totals: { subtotal, discount, gst, gstLabel: gstPct ? `GST ${gstPct}%` : "GST%", cartage, total },
    notes: [
      { label: "AGAINST", value: source },
      { label: "DELIVERY NOTES", value: po.notes },
    ],
    terms: [...PO_STANDARD_TERMS, ...termsList(po.terms_and_conditions)],
    sign: {
      left: {
        title: "FOR RIPPOTAI",
        caption: "Authorised Signatory",
        name: approved ? personName(po.approver || po.approved_by_user || po.approved_by) : "",
        date: approved && po.approved_at ? sheetDate(po.approved_at) : "",
      },
      right: { title: "VENDOR ACKNOWLEDGEMENT", caption: "Signature & Stamp" },
    },
  };
}


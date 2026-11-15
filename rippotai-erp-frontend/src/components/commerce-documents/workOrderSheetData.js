// Work order → data for the WORK ORDER sheet (template-documents/order-sheet.jsx).
import { has } from "../print-document";
import { fmtPhone, parseTaxIds, qty, rs, termsList } from "../print-document/commerce";
import { sheetDate } from "../template-documents/sheet-utils";
import {
  getWorkOrderNumber, getProjectName, getVendorName, getItems, getPaymentStages, getTerms,
} from "../work-orders/workOrderFormat";

// Standard WO conditions — wording exactly as printed on the template; WO-specific terms follow.
export const WO_STANDARD_TERMS = [
  "Execution commences only upon receipt of site clearance and signed BOQ specification drawings from the Project Lead.",
  "All services must strictly conform to architectural layout tolerances and specified engineering standards. Unacceptable craftsmanship must be reworked at the contractor's sole expense.",
  "The contractor shall provide mandatory PPE (helmets, safety shoes,vests) to workers. Compliance with local labor and safety regulations is solely the contractor's liability.",
  "Running Account (RA) invoices must quote this Work Order ID and be backed by joint on-site measurement sheets endorsed by the Rippotai site engineer.",
  "Any extra item, rate revision, or variation must have written cost approval from Rippotai management before execution begins.",
  "The service contractor warrants workmanship for a Defect Liability Period (DLP) of 6 months post-handover.",
];

const bySort = (rows) => [...rows].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
const clean = (v) => (v === "-" ? "" : v);
const unitOf = (u) => (typeof u === "string" ? u : u?.code || u?.name || "");
const humanize = (s) => String(s || "").replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const norm = (s) => String(s || "").replace(/\s+/g, " ").trim().toLowerCase();

export function workOrderSheetData(wo, company) {
  const vendor = wo.vendor || {};
  const tax = parseTaxIds(vendor.notes);
  const items = bySort(getItems(wo));
  const stages = bySort(getPaymentStages(wo)).filter((s) => has(s.stage_name || s.name));
  const amountOf = (it) => it.amount ?? it.total ?? Number(it.quantity || 0) * Number(it.rate || 0);
  const subtotal = Number(wo.subtotal ?? items.reduce((s, it) => s + Number(amountOf(it) || 0), 0));
  const discount = Number(wo.discount || 0);
  const gstPct = Number(wo.gst_percentage || 0);
  const gst = Number(wo.gst_amount || 0);
  const cartage = Number(wo.cartage || 0);
  const total = Number(wo.total_amount ?? wo.grand_total ?? subtotal - discount + gst + cartage);
  const own = bySort(getTerms(wo)).flatMap((t) =>
    has(t.description) ? termsList(t.description) : termsList(t.terms_template?.content_html),
  );
  const std = new Set(WO_STANDARD_TERMS.map(norm));
  const project = wo.project || {};

  return {
    title: "WORK ORDER",
    subtitle: "SERVICE",
    company,
    meta: [
      { label: "WO ID:", value: getWorkOrderNumber(wo) },
      { label: "Date:", value: sheetDate(wo.work_order_date || wo.created_at) },
      { label: "Target Completion:", value: sheetDate(wo.target_completion_date) },
    ],
    band: ["SERVICE CONTRACTOR", "SITE & PROJECT LOCATION"],
    left: [
      ["AGENCY", { text: wo.contractor_company_name || wo.agency || clean(getVendorName(wo)), sub: wo.contractor_address || vendor.address }],
      ["CONTACT PERSON", [wo.contractor_name, wo.contractor_position].filter(has).join(" · ")],
      ["PHONE", fmtPhone(wo.contractor_phone || vendor.contact_number)],
      ["EMAIL", wo.contractor_email || vendor.email],
      ["GSTIN", wo.contractor_gstin || vendor.gstin || tax.gstin],
      ["PAN", wo.contractor_pan || vendor.pan || tax.pan],
    ],
    right: [
      ["PROJECT", clean(getProjectName(wo))],
      ["SITE ADDRESS", wo.site_address || project.site_location],
      ["SITE LEAD", wo.site_lead || wo.site_contact_person],
      ["CONTACT", { text: fmtPhone(wo.site_phone), sub: wo.site_email }],
      ["WORKING HOURS", wo.working_hours],
      ...(has(wo.site_gstin) ? [["GSTIN", wo.site_gstin]] : []),
    ],
    descHead: "DESCRIPTION OF SERVICE/DELIVERABLES",
    items: items.map((it) => ({
      desc: it.description || it.name,
      sub: [it.item_type && it.item_type !== "SERVICE" ? humanize(it.item_type) : "", it.remarks].filter(has).join(" · "),
      qty: qty(it.quantity),
      unit: String(unitOf(it.unit) || "").toLowerCase(),
      rate: it.rate,
      amount: amountOf(it),
    })),
    totals: { subtotal, discount, gst, gstLabel: gstPct ? `GST ${gstPct}%` : "GST%", cartage, total },
    payment: stages.map((s) => ({
      stage: s.stage_name || s.name,
      date: sheetDate(s.due_date || s.dueDate),
      amount: s.amount,
      remarks: [
        s.remarks,
        Number(s.paid_amount) > 0 ? `Paid ${rs(s.paid_amount)}` : "",
        s.status && !["PENDING", "UNPAID"].includes(s.status) ? humanize(s.status) : "",
      ]
        .filter(has)
        .join(" · "),
    })),
    paymentNote: wo.payment_terms,
    terms: [...WO_STANDARD_TERMS, ...own.filter((t) => !std.has(norm(t)))],
    sign: {
      left: {
        title: "FOR RIPPOTAI",
        caption: "Authorised Signatory",
        name: wo.rippotai_signatory_name,
        date: wo.rippotai_signed_at ? sheetDate(wo.rippotai_signed_at) : "",
      },
      right: {
        title: "VENDOR ACKNOWLEDGEMENT",
        caption: "Signature & Stamp",
        name: wo.contractor_signatory_name,
        date: wo.contractor_signed_at ? sheetDate(wo.contractor_signed_at) : "",
      },
    },
  };
}

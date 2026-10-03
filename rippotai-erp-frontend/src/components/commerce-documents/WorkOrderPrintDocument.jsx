// Work Order — Rippotai → service contractor, in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Totals, Terms, SignOff, has, fmtDate, humanize } from "../print-document";
import {
  COMMERCE_CLASS, Parties, companyParty, useCompanyProfile, parseTaxIds, fmtPhone,
  amountInWords, qty, rs, termsList, totalLines,
} from "../print-document/commerce";
import {
  getWorkOrderNumber, getProjectName, getVendorName, getItems, getPaymentStages, getTerms,
} from "../work-orders/workOrderFormat";

const bySort = (rows) => [...rows].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
const clean = (v) => (v === "-" ? "" : v);

export const workOrderFileName = (wo) =>
  `Work-Order_${String(getWorkOrderNumber(wo) || "draft").replace(/[^\w-]+/g, "-")}.pdf`;

const WorkOrderPrintDocument = forwardRef(function WorkOrderPrintDocument({ workOrder: wo }, ref) {
  const company = useCompanyProfile();

  const sections = useMemo(() => {
    if (!wo) return [];
    const vendor = wo.vendor || {};
    const tax = parseTaxIds(vendor.notes);
    const items = bySort(getItems(wo));
    const stages = bySort(getPaymentStages(wo)).filter((s) => has(s.stage_name || s.name));
    const terms = bySort(getTerms(wo));
    const amountOf = (it) => it.amount ?? it.total ?? Number(it.quantity || 0) * Number(it.rate || 0);
    const subtotal = Number(wo.subtotal ?? items.reduce((s, it) => s + Number(amountOf(it) || 0), 0));
    const discount = Number(wo.discount || 0);
    const gst = Number(wo.gst_amount || 0);
    const cartage = Number(wo.cartage || 0);
    const total = Number(wo.total_amount ?? wo.grand_total ?? subtotal - discount + gst + cartage);
    const unitOf = (u) => (typeof u === "string" ? u : u?.code || u?.name || "");

    const termItems = terms.flatMap((t) =>
      has(t.description) ? termsList(t.description) : termsList(t.terms_template?.content_html),
    );

    return [
      {
        title: "Order details",
        blocks: [
          <Parties
            key="p"
            parties={[
              companyParty(company, "Issued by"),
              {
                title: "Service contractor",
                name: wo.contractor_company_name || wo.agency || clean(getVendorName(wo)),
                lines: [wo.contractor_address || vendor.address],
                items: [
                  { label: "Contact", value: [wo.contractor_name, wo.contractor_position].filter(has).join(" · ") },
                  { label: "Phone", value: fmtPhone(wo.contractor_phone || vendor.contact_number) },
                  { label: "Email", value: wo.contractor_email || vendor.email },
                  { label: "GSTIN", value: wo.contractor_gstin || vendor.gstin || tax.gstin },
                  { label: "PAN", value: wo.contractor_pan || vendor.pan || tax.pan },
                ],
              },
              {
                title: "Site",
                name: clean(getProjectName(wo)),
                lines: [wo.site_address || wo.project?.site_location],
                items: [
                  { label: "Site lead", value: wo.site_lead || wo.site_contact_person },
                  { label: "Phone", value: fmtPhone(wo.site_phone) },
                  { label: "Email", value: wo.site_email },
                  { label: "GSTIN", value: wo.site_gstin },
                ],
              },
            ]}
          />,
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "Work order no.", value: getWorkOrderNumber(wo), strong: true },
              { label: "Date", value: fmtDate(wo.work_order_date || wo.created_at) },
              { label: "Target completion", value: fmtDate(wo.target_completion_date) },
              { label: "Working hours", value: wo.working_hours },
            ]}
          />,
        ],
      },
      {
        title: "Scope of work",
        rows: {
          cols: ["No.", "Description of work", "#Qty", "Unit", "#Rate", "#Amount"],
          template: "8mm 1fr 17mm 11mm 22mm 26mm",
          items: items.map((it, i) => ({
            key: it.id || i,
            cells: [
              { text: String(i + 1), strong: false },
              {
                text: it.description || it.name,
                sub: [it.item_type && it.item_type !== "SERVICE" ? humanize(it.item_type) : "", it.remarks].filter(has).join(" · "),
                strong: true,
              },
              qty(it.quantity),
              String(unitOf(it.unit) || "").toLowerCase(),
              rs(it.rate),
              rs(amountOf(it)),
            ],
          })),
        },
        blocks: [
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
                  { label: `GST @ ${Number(wo.gst_percentage || 0)}%`, value: gst },
                  { label: "Cartage", value: cartage },
                  { label: "Grand total", value: total, grand: true },
                ])}
              />
            ),
          },
        ],
      },
      {
        title: "Payment schedule",
        rows: stages.length
          ? {
              cols: ["Stage", "Due", "#Amount", "Remarks"],
              template: "1fr 28mm 28mm 44mm",
              items: stages.map((s, i) => ({
                key: s.id || i,
                cells: [
                  s.stage_name || s.name,
                  fmtDate(s.due_date || s.dueDate, { short: true }),
                  rs(s.amount),
                  {
                    text: [s.remarks, Number(s.paid_amount) > 0 ? `Paid ${rs(s.paid_amount)}` : ""].filter(has).join(" · "),
                    sub: s.status && !["PENDING", "UNPAID"].includes(s.status) ? humanize(s.status) : "",
                    strong: false,
                  },
                ],
              })),
            }
          : null,
        blocks: [has(wo.payment_terms) ? { text: { label: "Payment terms", value: wo.payment_terms } } : null],
      },
      { title: "Terms & conditions", blocks: [<Terms key="t" items={termItems} />] },
      {
        title: "Acceptance",
        blocks: [
          <SignOff
            key="s"
            left={{
              name: wo.rippotai_signatory_name || company.name,
              role: ["For Rippotai · Authorised signatory", wo.rippotai_signed_at ? fmtDate(wo.rippotai_signed_at, { short: true }) : ""].filter(has).join(" · "),
            }}
            right={{
              name: wo.contractor_signatory_name || wo.contractor_company_name || wo.agency || "Contractor",
              role: ["Contractor · signature & stamp", wo.contractor_signed_at ? fmtDate(wo.contractor_signed_at, { short: true }) : ""].filter(has).join(" · "),
            }}
          />,
        ],
      },
    ];
  }, [wo, company]);

  if (!wo) return null;
  const no = getWorkOrderNumber(wo);
  const contractor = wo.contractor_company_name || wo.agency || clean(getVendorName(wo));
  const project = clean(getProjectName(wo));
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Work Order"
      title={project || "Work order"}
      subtitle={contractor}
      coverDetails={[
        { label: "Contractor", value: contractor, sub: wo.contractor_name },
        { label: "Project", value: project, sub: wo.project?.client?.name },
        { label: "Site", value: wo.project?.site_location || wo.site_address },
        { label: "Work order no.", value: no },
        {
          label: "Date",
          value: fmtDate(wo.work_order_date || wo.created_at),
          sub: wo.target_completion_date ? `Complete by ${fmtDate(wo.target_completion_date, { short: true })}` : "",
        },
        { label: "Order value", value: rs(wo.total_amount), sub: Number(wo.gst_percentage) ? `Incl. GST @ ${Number(wo.gst_percentage)}%` : "" },
      ]}
      footerNote={has(contractor) ? `Issued to ${contractor}` : ""}
      preparedFor={contractor}
      reference={no}
      date={fmtDate(wo.work_order_date, { short: true })}
      sections={sections}
    />
  );
});

export default WorkOrderPrintDocument;

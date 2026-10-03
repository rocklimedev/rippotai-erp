// Quotation — vendor quotation recorded against a project, in the shared Rippotai print format.
import React, { forwardRef, useMemo } from "react";
import { PrintDocument, KV, Totals, Terms, SignOff, has, fmtDate } from "../print-document";
import {
  COMMERCE_CLASS, Parties, companyParty, useCompanyProfile, parseTaxIds, fmtPhone,
  amountInWords, qty, rs, termsList, addDays, totalLines, bankBlocks,
} from "../print-document/commerce";

export const quotationFileName = (q) =>
  `Quotation_${String(q?.quotationNumber || q?.quotation_number || "draft").replace(/[^\w-]+/g, "-")}.pdf`;

const QuotationDocument = forwardRef(function QuotationDocument({ quotation: q }, ref) {
  const company = useCompanyProfile();
  const sections = useMemo(() => {
    if (!q) return [];
    const vendor = q.vendor || q.vendorSnapshot || {};
    const project = q.project || q.projectSnapshot || {};
    const tax = parseTaxIds(vendor.notes);
    const items = [...(q.items || [])].sort((a, b) => Number(a.sno || 0) - Number(b.sno || 0));
    const date = q.quotationDate || q.quotation_date;
    const validUntil = q.expiryDate || addDays(date, q.validityDays);
    const subtotal = Number(q.subtotal || 0);
    const discountPct = q.globalDiscountType === "percentage" || q.globalDiscountType === "percent";
    const discount = Number(q.discount || 0) || (discountPct ? 0 : Number(q.globalDiscountValue || 0));
    const taxPct = Number(q.taxPercent || 0);

    return [
      {
        title: "Parties",
        blocks: [
          <Parties
            key="p"
            parties={[
              {
                title: "Vendor",
                name: vendor.company_name || vendor.name,
                lines: [vendor.address, fmtPhone(vendor.contact_number || vendor.phone)],
                items: [
                  { label: "Trade", value: vendor.businessType?.name || vendor.vendorCategory?.name },
                  { label: "GSTIN", value: vendor.gstin || tax.gstin },
                  { label: "PAN", value: vendor.pan || tax.pan },
                ],
              },
              {
                title: "Project",
                name: project.name,
                lines: [project.site_location || project.address],
                items: [{ label: "Client", value: project.client?.name }],
              },
              companyParty(company, "Issued to"),
            ]}
          />,
          <KV
            key="kv"
            cols={3}
            items={[
              { label: "Quotation no.", value: q.quotationNumber || q.quotation_number, strong: true },
              { label: "Date", value: fmtDate(date) },
              { label: "Valid until", value: fmtDate(validUntil) },
              { label: "BOQ reference", value: q.boqReference },
              { label: "Version", value: q.currentVersion > 1 ? `Version ${q.currentVersion}` : "" },
            ]}
          />,
        ],
      },
      {
        title: "Items",
        rows: {
          cols: ["No.", "Particulars", "#Qty", "#Rate", "#Amount"],
          template: "9mm 1fr 20mm 25mm 29mm",
          items: items.map((it, i) => ({
            key: it.id || i,
            cells: [
              { text: String(it.sno || i + 1), strong: false },
              { text: it.particular, sub: it.remarks, strong: true },
              qty(it.quantity),
              rs(it.rate),
              rs(it.amount ?? Number(it.rate || 0) * Number(it.quantity || 0)),
            ],
          })),
        },
        blocks: [
          {
            keep: (
              <Totals
                key="t"
                decimals={2}
                words={amountInWords(q.totalAmount)}
                lines={totalLines([
                  { label: "Subtotal", value: subtotal, always: true },
                  { label: discountPct ? `Discount @ ${Number(q.globalDiscountValue || 0)}%` : "Discount", value: -Math.abs(discount) },
                  { label: "Additional charges", value: Number(q.additionalCharges || 0) },
                  { label: `GST @ ${taxPct}%`, value: Number(q.taxAmount || 0) },
                  { label: "Grand total", value: Number(q.totalAmount || 0), grand: true },
                ])}
              />
            ),
          },
        ],
      },
      { title: "Terms & conditions", blocks: [<Terms key="t" items={termsList(q.termsConditions || q.terms_conditions)} />] },
      { title: "Bank details", blocks: bankBlocks(company) },
      {
        title: "Acceptance",
        blocks: [
          <SignOff
            key="s"
            left={{ name: company.name, role: "Authorised signatory" }}
            right={{ name: vendor.company_name || vendor.name || "Vendor", role: "Signature & stamp" }}
          />,
        ],
      },
    ];
  }, [q, company]);

  if (!q) return null;
  const vendor = q.vendor || q.vendorSnapshot || {};
  const project = q.project || q.projectSnapshot || {};
  const date = q.quotationDate || q.quotation_date;
  const no = q.quotationNumber || q.quotation_number;
  return (
    <PrintDocument
      ref={ref}
      className={COMMERCE_CLASS}
      docType="Quotation"
      title={project.name}
      subtitle={has(vendor.name) ? `${vendor.company_name || vendor.name}${vendor.businessType?.name ? ` · ${vendor.businessType.name}` : ""}` : ""}
      coverDetails={[
        { label: "Vendor", value: vendor.company_name || vendor.name, sub: fmtPhone(vendor.contact_number) },
        { label: "Project", value: project.name, sub: project.client?.name },
        { label: "Site", value: project.site_location },
        { label: "Quotation no.", value: no },
        { label: "Date", value: fmtDate(date), sub: q.validityDays ? `Valid ${q.validityDays} days` : "" },
        { label: "Amount", value: rs(q.totalAmount), sub: Number(q.taxPercent) ? `Incl. GST @ ${Number(q.taxPercent)}%` : "" },
      ]}
      preparedFor={project.name}
      reference={no}
      date={fmtDate(date, { short: true })}
      sections={sections}
    />
  );
});

export default QuotationDocument;

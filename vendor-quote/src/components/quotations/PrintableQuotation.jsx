import React from "react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/helpers";
import logoUrl from "../../assets/logo.png";
// ---------------------------------------------------------------------------
// Printable Quotation
// Layout matches the standard company quotation template:
// logo + date header, centered "QUOTATION" title with number/version,
// double rule, vendor/project info boxes, S.no/Particular/Rate/Quantity/
// Amount/Remarks table, Subtotal/Discount/Grand Total block, Terms &
// Conditions box, and Approved By / Contractor's Signature footer.
// ---------------------------------------------------------------------------
export default function PrintableQuotation({
  quotation,
  adminSignature,
  termsConditions,
  company,
}) {
  if (!quotation) return null;
  const isApproved = quotation.status === "approved";
  const q = quotation; // already normalised

  const companyName = company?.name || "Your Company";
  const companyTagline = company?.tagline || "";

  return (
    <div
      className="print-quotation-content bg-white mx-auto"
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "900px",
        padding: "40px 50px",
      }}
    >
      {/* Header: logo + date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={logoUrl}
            alt={companyName}
            style={{ width: 80, height: 80, objectFit: "contain" }}
          />
        </div>

        <div className="text-sm">
          Date:{" "}
          <span className="font-medium">{formatDate(q.quotation_date)}</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-3">
        <h1
          className="font-bold"
          style={{ fontSize: 28, letterSpacing: 1.5, color: "#1A1A1A" }}
        >
          QUOTATION
        </h1>
        <div className="text-base mt-0.5">{q.quotation_number}</div>
      </div>

      <div
        className="mb-5"
        style={{
          borderBottom: "1px solid #1A1A1A",
          height: 6,
        }}
      />
      {/* Vendor / Project info boxes */}
      <div className="flex gap-2 mb-6">
        <div
          className="flex-1 px-4 py-3 text-sm leading-relaxed"
          style={{ border: "1.5px solid #1A1A1A" }}
        >
          <div className="font-bold">{q.vendor_snapshot?.name}</div>
          <div>{q.vendor_snapshot?.company_name}</div>
          <div>{q.vendor_snapshot?.contact_number}</div>
          <div>{q.vendor_snapshot?.address}</div>
        </div>
        <div
          className="flex-1 flex items-center justify-center text-center px-4 py-3 text-sm"
          style={{ border: "1.5px solid #1A1A1A" }}
        >
          <div>
            <div className="font-medium">{q.project_snapshot?.name}</div>
            <div>{q.project_snapshot?.site_location}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table
        className="w-full border-collapse text-sm mb-2"
        style={{ border: "1.5px solid #1A1A1A" }}
      >
        <thead>
          <tr>
            <th
              className="px-2 py-1.5 text-center font-semibold"
              style={{ border: "1.5px solid #1A1A1A", width: 40 }}
            >
              S.no
            </th>
            <th
              className="px-2 py-1.5 text-center font-semibold"
              style={{ border: "1.5px solid #1A1A1A" }}
            >
              Particular
            </th>
            <th
              className="px-2 py-1.5 text-right font-semibold"
              style={{ border: "1.5px solid #1A1A1A", width: 90 }}
            >
              Rate (₹)
            </th>
            <th
              className="px-2 py-1.5 text-right font-semibold"
              style={{ border: "1.5px solid #1A1A1A", width: 70 }}
            >
              Quantity
            </th>
            <th
              className="px-2 py-1.5 text-right font-semibold"
              style={{ border: "1.5px solid #1A1A1A", width: 100 }}
            >
              Amount (₹)
            </th>
            <th
              className="px-2 py-1.5 text-left font-semibold"
              style={{ border: "1.5px solid #1A1A1A", width: 110 }}
            >
              Remarks
            </th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((item, i) => (
            <tr key={i}>
              <td
                className="px-2 py-1.5 text-center"
                style={{ border: "1.5px solid #1A1A1A" }}
              >
                {item.sno}
              </td>
              <td
                className="px-2 py-1.5"
                style={{ border: "1.5px solid #1A1A1A" }}
              >
                {item.particular}
              </td>
              <td
                className="px-2 py-1.5 text-right"
                style={{ border: "1.5px solid #1A1A1A" }}
              >
                {formatCurrency(item.rate)}
              </td>
              <td
                className="px-2 py-1.5 text-right"
                style={{ border: "1.5px solid #1A1A1A" }}
              >
                {item.quantity}
              </td>
              <td
                className="px-2 py-1.5 text-right font-medium"
                style={{ border: "1.5px solid #1A1A1A" }}
              >
                {formatCurrency(item.amount)}
              </td>
              <td
                className="px-2 py-1.5 text-xs"
                style={{ border: "1.5px solid #1A1A1A" }}
              >
                {item.remarks}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-2">
        <div className="w-72">
          <div className="flex justify-between text-sm py-1">
            <span className="font-bold">Subtotal</span>
            <span>{formatCurrency(q.subtotal)}</span>
          </div>

          {q.additional_charges > 0 && (
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-600">Additional Charges</span>
              <span>{formatCurrency(q.additional_charges)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm py-1">
            <span className="font-bold">
              Discount
              {q.global_discount_type === "percentage" &&
              q.global_discount_value > 0
                ? ` (${q.global_discount_value}%)`
                : ""}
            </span>
            <span className="text-red-600">
              {q.discount > 0
                ? `- ${formatCurrency(q.discount)}`
                : formatCurrency(0)}
            </span>
          </div>

          {q.tax_percent > 0 && (
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-600">Tax ({q.tax_percent}%)</span>
              <span>{formatCurrency(q.tax_amount)}</span>
            </div>
          )}

          <div
            className="flex justify-between text-sm py-1.5 font-bold"
            style={{ borderTop: "1.5px solid #1A1A1A" }}
          >
            <span>Grand Total</span>
            <span>{formatCurrency(q.total_amount)}</span>
          </div>
        </div>
      </div>

      <div className="mb-5" style={{ borderTop: "1.5px solid #1A1A1A" }} />

      {/* Terms & Conditions */}
      <div className="mb-10">
        <div className="text-sm mb-2">Terms &amp; Conditions:</div>
        <div
          className="text-xs text-gray-700 whitespace-pre-line px-3 py-3"
          style={{ border: "1.5px solid #1A1A1A", minHeight: 110 }}
        >
          {termsConditions || q.terms_conditions}
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-16">
        <div className="w-2/5">
          <div
            style={{ borderTop: "2px solid #1A1A1A" }}
            className="pt-1.5 mb-1"
          >
            <span className="text-xs tracking-wide">APPROVED BY</span>

            {isApproved && adminSignature?.signature_url && (
              <img
                src={adminSignature.signature_url}
                alt="Admin Signature"
                style={{ maxHeight: 60, maxWidth: 170, objectFit: "contain" }}
              />
            )}
          </div>
        </div>
        <div className="w-2/5">
          <div
            style={{ borderTop: "2px solid #1A1A1A" }}
            className="pt-1.5 mb-1"
          />
          <span className="text-xs tracking-wide">CONTRACTOR'S SIGNATURE</span>
        </div>
      </div>
    </div>
  );
}

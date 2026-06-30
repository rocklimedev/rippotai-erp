import React from "react";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusConfig,
} from "../../utils/helpers";

// ---------------------------------------------------------------------------
// Details Tab
// ---------------------------------------------------------------------------
export default function DetailsTab({ quotation: q }) {
  const cfg = getStatusConfig(q.status);

  return (
    <div className="space-y-5">
      {/* Basic Info Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Basic Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Quotation Number</div>
            <div className="font-medium text-[#333333]">
              {q.quotation_number}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Date</div>
            <div className="font-medium text-[#333333]">
              {formatDate(q.quotation_date)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Status</div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              {cfg.label}
            </span>
          </div>
          {q.submitted_at && (
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Submitted At</div>
              <div className="font-medium text-[#333333]">
                {formatDateTime(q.submitted_at)}
              </div>
            </div>
          )}
          {q.approved_at && (
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Approved At</div>
              <div className="font-medium text-[#333333]">
                {formatDateTime(q.approved_at)}
              </div>
            </div>
          )}
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Last Updated</div>
            <div className="font-medium text-[#333333]">
              {formatDateTime(q.updated_at)}
            </div>
          </div>
        </div>

        {q.review_remarks && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
            <div className="text-xs font-semibold text-amber-700 mb-0.5">
              Review Remarks
            </div>
            <div className="text-sm text-amber-800">{q.review_remarks}</div>
          </div>
        )}
      </div>

      {/* Vendor Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Vendor
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Name</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Company</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.company_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Contact</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.contact_number}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-400 mb-0.5">Address</div>
            <div className="font-medium text-[#333333]">
              {q.vendor_snapshot?.address}
            </div>
          </div>
        </div>
      </div>

      {/* Project Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Project
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Project Name</div>
            <div className="font-medium text-[#333333]">
              {q.project_snapshot?.name}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Site Location</div>
            <div className="font-medium text-[#333333]">
              {q.project_snapshot?.site_location}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-[#E5E7EB] rounded-md overflow-hidden">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-10">
                  #
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB]">
                  Particular
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-24">
                  Rate (₹)
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-20">
                  Qty
                </th>
                <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-28">
                  Amount (₹)
                </th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 border-b border-[#E5E7EB] w-32">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {q.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-b border-[#F3F4F6] hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-gray-400 text-center">
                    {item.sno}
                  </td>
                  <td className="px-3 py-2 text-[#333333]">
                    {item.particular}
                  </td>
                  <td className="px-3 py-2 text-right text-[#333333]">
                    {formatCurrency(item.rate)}
                  </td>
                  <td className="px-3 py-2 text-right text-[#333333]">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-[#333333]">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {item.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-[#333333]">
                {formatCurrency(q.subtotal)}
              </span>
            </div>
            {q.additional_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Additional Charges</span>
                <span className="text-[#333333]">
                  {formatCurrency(q.additional_charges)}
                </span>
              </div>
            )}
            {q.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  Discount
                  {q.global_discount_type === "percentage"
                    ? ` (${q.global_discount_value}%)`
                    : ` (Fixed)`}
                </span>
                <span className="text-red-500">
                  - {formatCurrency(q.discount)}
                </span>
              </div>
            )}
            {q.tax_percent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({q.tax_percent}%)</span>
                <span className="text-[#333333]">
                  {formatCurrency(q.tax_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t border-[#E5E7EB] pt-2">
              <span className="text-[#333333]">Grand Total</span>
              <span className="text-[#1A3C34] text-base">
                {formatCurrency(q.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      {q.terms_conditions && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Terms & Conditions
          </h2>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
            {q.terms_conditions}
          </pre>
        </div>
      )}
    </div>
  );
}

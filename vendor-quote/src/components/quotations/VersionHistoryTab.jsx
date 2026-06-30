import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock, FileText } from "lucide-react";
import { useGetQuotationVersionsQuery } from "../../api/quotation.api";
import {
  formatCurrency,
  formatDateTime,
  getStatusConfig,
} from "../../utils/helpers";
import { normaliseQuotation } from "../../utils/normaliseQuotation";
// ---------------------------------------------------------------------------
// Version History Tab
// ---------------------------------------------------------------------------
export default function VersionHistoryTab({ quotationId }) {
  const [expandedId, setExpandedId] = useState(null);

  // Assumes your quotation API has a versions endpoint.
  // If not yet implemented, this shows a graceful empty state.
  const { data: versions = [], isLoading } = useGetQuotationVersionsQuery(
    quotationId,
    {
      skip: !quotationId,
    },
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center text-sm text-gray-400">
        Loading version history...
      </div>
    );
  }

  if (!versions.length) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center">
        <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          No version history available yet.
        </p>
        <p className="text-xs text-gray-300 mt-1">
          Versions are created each time this quotation is edited and
          resubmitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v, idx) => {
        const normV = normaliseQuotation(v);
        const cfg = getStatusConfig(normV.status);
        const isExpanded = expandedId === v.id;
        const isLatest = idx === 0;

        return (
          <div
            key={v.id}
            className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
          >
            {/* Version Header — always visible */}
            <button
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : v.id)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1A3C34]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#1A3C34]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#333333]">
                      Version{" "}
                      {normV.current_version > 0
                        ? normV.current_version
                        : idx + 1}
                    </span>
                    {isLatest && (
                      <span className="text-xs bg-[#1A3C34] text-white px-1.5 py-0.5 rounded font-medium">
                        Latest
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(normV.updated_at || normV.created_at)}
                    {normV.review_remarks && (
                      <span className="ml-2 text-amber-600">
                        · Remarks: {normV.review_remarks}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#1A3C34]">
                  {formatCurrency(normV.total_amount)}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Detail */}
            {isExpanded && (
              <div className="border-t border-[#E5E7EB] px-5 py-4 bg-gray-50">
                {/* Items mini-table */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border border-[#E5E7EB] rounded overflow-hidden bg-white">
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
                      {normV.items.map((item, i) => (
                        <tr key={i} className="border-b border-[#F3F4F6]">
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

                {/* Version Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span>{formatCurrency(normV.subtotal)}</span>
                    </div>
                    {normV.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-red-500">
                          - {formatCurrency(normV.discount)}
                        </span>
                      </div>
                    )}
                    {normV.tax_percent > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Tax ({normV.tax_percent}%)
                        </span>
                        <span>{formatCurrency(normV.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-[#E5E7EB] pt-1">
                      <span>Total</span>
                      <span className="text-[#1A3C34]">
                        {formatCurrency(normV.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

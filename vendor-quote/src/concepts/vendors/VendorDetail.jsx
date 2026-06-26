import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useGetVendorByIdQuery,
  useGetQuotationsByVendorQuery,
} from "../../api/vendor.api";

import {
  formatCurrency,
  formatDate,
  getStatusConfig,
} from "../../utils/helpers";
import {
  ArrowLeft,
  Eye,
  Phone,
  MapPin,
  Building,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch Vendor Details
  const {
    data: vendorData,
    isLoading: vendorLoading,
    error: vendorError,
  } = useGetVendorByIdQuery(id);

  // Fetch Quotations for this Vendor
  const { data: quotationsData, isLoading: quotationsLoading } =
    useGetQuotationsByVendorQuery(id, {
      skip: !id,
    });

  const vendor = vendorData?.data || vendorData;
  const quotations = quotationsData?.data || quotationsData || [];

  if (vendorLoading)
    return <div className="p-6 text-sm text-gray-400">Loading vendor...</div>;

  if (vendorError || !vendor)
    return <div className="p-6 text-sm text-red-500">Vendor not found</div>;

  const { summary = {} } = vendor;
  const statusCfg = getStatusConfig(vendor.status);

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/vendors")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#333333] mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendors
      </button>

      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#333333]">{vendor.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
            >
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{vendor.company_name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Vendor Details */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-lg p-5">
          <h2 className="text-sm font-semibold text-[#333333] mb-4">
            Vendor Details
          </h2>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-500">Company</div>
                <div className="font-medium">{vendor.company_name || "—"}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-500">Business Type</div>
                <div className="font-medium">
                  {vendor.type_of_business || vendor.businessType?.name || "—"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-500">Contact</div>
                <div className="font-medium">{vendor.contact_number}</div>
                {vendor.alternate_contact && (
                  <div className="text-gray-500">
                    {vendor.alternate_contact}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 col-span-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-500">Address</div>
                <div className="font-medium">{vendor.address || "—"}</div>
              </div>
            </div>
            {vendor.notes && (
              <div className="col-span-2">
                <div className="text-xs text-gray-500">Notes</div>
                <div className="mt-0.5 text-gray-700">{vendor.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="space-y-3">
          {[
            {
              label: "Total Quotations",
              value: summary.total || 0,
              icon: Clock,
              color: "text-gray-600",
              bg: "bg-gray-100",
            },
            {
              label: "Pending",
              value: summary.pending || 0,
              icon: Clock,
              color: "text-yellow-600",
              bg: "bg-yellow-50",
            },
            {
              label: "Approved",
              value: summary.approved || 0,
              icon: CheckCircle,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Declined",
              value: summary.declined || 0,
              icon: XCircle,
              color: "text-red-600",
              bg: "bg-red-50",
            },
            {
              label: "Projects",
              value: summary.projects_count || 0,
              icon: TrendingUp,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-md flex items-center justify-center ${card.bg}`}
              >
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div>
                <div className={`text-xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-xs text-gray-400">{card.label}</div>
              </div>
            </div>
          ))}

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-md flex items-center justify-center bg-green-50">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-base font-bold text-green-700">
                {formatCurrency(summary.approved_value || 0)}
              </div>
              <div className="text-xs text-gray-400">Approved Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E5E7EB] flex justify-between items-center">
          <h2 className="text-sm font-semibold text-[#333333]">
            Vendor Quotations
          </h2>
          {quotationsLoading && (
            <span className="text-xs text-gray-400">Loading...</span>
          )}
        </div>

        {!quotations.length ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No quotations found for this vendor
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Quotation #
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Project
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Version
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => {
                const cfg = getStatusConfig(q.status);
                return (
                  <tr
                    key={q.id}
                    className="border-b border-[#F3F4F6] hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#E31E24]">
                      {q.quotation_number || q.quotationNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {q.project_name || q.projectSnapshot?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {q.current_version > 0 ? `V${q.current_version}` : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatCurrency(q.total_amount || q.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(q.quotation_date || q.quotationDate)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/quotations/${q.id}`)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#333333]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

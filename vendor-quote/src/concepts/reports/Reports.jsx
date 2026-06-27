import React, { useState } from "react";
import { formatCurrency } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import { BarChart2, TrendingUp, Package, Users, User } from "lucide-react";

// Import RTK Query hooks
import {
  useGetReportsOverviewQuery,
  useGetReportsByProjectQuery,
  useGetReportsByVendorQuery,
  useGetReportsByStatusQuery,
  useGetReportsByEmployeeQuery,
} from "../../api/reports.api";

const TABS = ["overview", "by-project", "by-vendor", "by-status"];

export default function Reports() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");

  // RTK Query Hooks
  const { data: overview, isLoading: overviewLoading } =
    useGetReportsOverviewQuery();

  const { data: byProject = [], isLoading: projectLoading } =
    useGetReportsByProjectQuery();

  const { data: byVendor = [], isLoading: vendorLoading } =
    useGetReportsByVendorQuery();

  const { data: byStatus = [], isLoading: statusLoading } =
    useGetReportsByStatusQuery();

  const { data: byEmployee = [], isLoading: employeeLoading } =
    useGetReportsByEmployeeQuery(undefined, { skip: user?.role !== "ADMIN" });

  // Overall loading state
  const isLoading =
    overviewLoading ||
    projectLoading ||
    vendorLoading ||
    statusLoading ||
    (user?.role === "ADMIN" && employeeLoading);

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-400">Loading reports...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#333333] mb-5">Reports</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-5 overflow-x-auto">
        {TABS.filter((t) => t !== "by-employee" || user?.role === "ADMIN").map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
                tab === t
                  ? "border-[#E31E24] text-[#E31E24]"
                  : "border-transparent text-gray-500 hover:text-[#333333]"
              }`}
            >
              {t.replace(/-/g, " ")}
            </button>
          ),
        )}

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setTab("by-employee")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === "by-employee"
                ? "border-[#E31E24] text-[#E31E24]"
                : "border-transparent text-gray-500 hover:text-[#333333]"
            }`}
          >
            By Employee
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && overview && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                label: "Total",
                value: overview.total,
                color: "text-[#333333]",
              },
              { label: "Draft", value: overview.draft, color: "text-gray-500" },
              {
                label: "Pending",
                value: overview.submitted,
                color: "text-yellow-600",
              },
              {
                label: "Returned",
                value: overview.returned,
                color: "text-blue-600",
              },
              {
                label: "Approved",
                value: overview.approved,
                color: "text-green-600",
              },
              {
                label: "Declined",
                value: overview.declined,
                color: "text-red-500",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white border border-[#E5E7EB] rounded-lg p-4"
              >
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-md flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(overview.approved_value)}
                </div>
                <div className="text-sm text-gray-500">
                  Total Approved Quotation Value
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* By Project Tab */}
      {tab === "by-project" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Project
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Pending
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Approved
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Declined
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Approved Value
                </th>
              </tr>
            </thead>
            <tbody>
              {byProject.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No data
                  </td>
                </tr>
              ) : (
                byProject.map((row, i) => (
                  <tr
                    key={row._id || i}
                    className="border-b border-[#F3F4F6] hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#333333]">
                      {row.project_name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-center text-yellow-600">
                      {row.pending}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600">
                      {row.approved}
                    </td>
                    <td className="px-4 py-3 text-center text-red-500">
                      {row.declined}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {formatCurrency(row.approved_value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* By Vendor Tab - Similar structure */}
      {tab === "by-vendor" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Vendor
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Pending
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Approved
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Declined
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Approved Value
                </th>
              </tr>
            </thead>
            <tbody>
              {byVendor.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No data
                  </td>
                </tr>
              ) : (
                byVendor.map((row, i) => (
                  <tr
                    key={row._id || i}
                    className="border-b border-[#F3F4F6] hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#333333]">
                      {row.vendor_name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-center text-yellow-600">
                      {row.pending}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600">
                      {row.approved}
                    </td>
                    <td className="px-4 py-3 text-center text-red-500">
                      {row.declined}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {formatCurrency(row.approved_value)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* By Status Tab */}
      {tab === "by-status" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Count
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody>
              {byStatus.map((row, i) => (
                <tr
                  key={row._id || i}
                  className="border-b border-[#F3F4F6] hover:bg-gray-50"
                >
                  <td className="px-4 py-3 capitalize font-medium text-[#333333]">
                    {row._id?.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {row.count}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#333333]">
                    {formatCurrency(row.total_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* By Employee Tab */}
      {tab === "by-employee" && user?.role === "ADMIN" && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Employee
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Total
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Draft
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Pending
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Approved
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                  Declined
                </th>
              </tr>
            </thead>
            <tbody>
              {byEmployee.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-400"
                  >
                    No data
                  </td>
                </tr>
              ) : (
                byEmployee.map((row, i) => (
                  <tr
                    key={row._id || i}
                    className="border-b border-[#F3F4F6] hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-[#333333]">
                      {row.employee_name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {row.total}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {row.draft}
                    </td>
                    <td className="px-4 py-3 text-center text-yellow-600">
                      {row.pending}
                    </td>
                    <td className="px-4 py-3 text-center text-green-600">
                      {row.approved}
                    </td>
                    <td className="px-4 py-3 text-center text-red-500">
                      {row.declined}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

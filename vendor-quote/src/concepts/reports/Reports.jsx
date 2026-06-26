import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { formatCurrency } from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import { BarChart2, TrendingUp, Package, Users, User } from "lucide-react";

const TABS = ["overview", "by-project", "by-vendor", "by-status"];

export default function Reports() {
  const { user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [byProject, setByProject] = useState([]);
  const [byVendor, setByVendor] = useState([]);
  const [byEmployee, setByEmployee] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const promises = [
        api.get("/reports/overview"),
        api.get("/reports/by-project"),
        api.get("/reports/by-vendor"),
        api.get("/reports/by-status"),
      ];
      if (user?.role === "admin")
        promises.push(api.get("/reports/by-employee"));
      const results = await Promise.all(promises);
      setOverview(results[0].data);
      setByProject(results[1].data);
      setByVendor(results[2].data);
      setByStatus(results[3].data);
      if (user?.role === "admin" && results[4]) setByEmployee(results[4].data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-6 text-sm text-gray-400">Loading reports...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#333333] mb-5">Reports</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E7EB] mb-5 overflow-x-auto">
        {TABS.filter((t) => t !== "by-employee" || user?.role === "admin").map(
          (t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${tab === t ? "border-[#E31E24] text-[#E31E24]" : "border-transparent text-gray-500 hover:text-[#333333]"}`}
            >
              {t.replace(/-/g, " ")}
            </button>
          ),
        )}
        {user?.role === "admin" && (
          <button
            onClick={() => setTab("by-employee")}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === "by-employee" ? "border-[#E31E24] text-[#E31E24]" : "border-transparent text-gray-500 hover:text-[#333333]"}`}
          >
            By Employee
          </button>
        )}
      </div>

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

      {tab === "by-employee" && user?.role === "admin" && (
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

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  formatCurrency,
  formatDate,
  getStatusConfig,
} from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  FileText,
  FolderOpen,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  ArrowRight,
} from "lucide-react";

// RTK Query
import { useGetQuotationsQuery } from "../../api/quotation.api";
import { useGetReportsOverviewQuery } from "../../api/reports.api"; // ✅ NEW

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Quotations
  const { data: quotationsData = [], isLoading: isQuotationsLoading } =
    useGetQuotationsQuery({
      limit: 5,
      page: 1,
    });

  // ✅ Reports Overview (RTK Query)
  const {
    data: stats,
    isLoading: loadingStats,
    isError,
  } = useGetReportsOverviewQuery();

  const recentQuotations = quotationsData;

  const isLoading = isQuotationsLoading || loadingStats;

  const STAT_CARDS = stats
    ? [
        {
          label: "Total Quotations",
          value: stats.total,
          icon: FileText,
          color: "text-[#333333]",
          bg: "bg-gray-100",
        },
        {
          label: "Draft",
          value: stats.draft,
          icon: FileText,
          color: "text-gray-500",
          bg: "bg-gray-100",
          link: "/quotations?status=draft",
        },
        {
          label: "Pending Approval",
          value: stats.submitted,
          icon: Clock,
          color: "text-yellow-600",
          bg: "bg-yellow-50",
          link: "/quotations?status=submitted",
        },
        {
          label: "Returned",
          value: stats.returned,
          icon: RotateCcw,
          color: "text-blue-600",
          bg: "bg-blue-50",
          link: "/quotations?status=returned_for_editing",
        },
        {
          label: "Approved",
          value: stats.approved,
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50",
          link: "/quotations?status=approved",
        },
        {
          label: "Declined",
          value: stats.declined,
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50",
          link: "/quotations?status=declined",
        },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-sm text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, {user?.name}
          </p>
        </div>
        <Link
          to="/quotations/create"
          className="flex items-center gap-2 bg-[#1A3C34] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-[#245247] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            onClick={() => card.link && navigate(card.link)}
            className={`bg-white border border-[#E5E7EB] rounded-lg p-4 ${
              card.link ? "cursor-pointer hover:border-gray-300" : ""
            } transition-colors`}
          >
            <div
              className={`inline-flex items-center justify-center w-9 h-9 rounded-md ${card.bg} mb-3`}
            >
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {card.value}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Approved Value */}
      {stats && (
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-green-50">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(stats.approved_value)}
              </div>
              <div className="text-xs text-gray-500">
                Total Approved Quotation Value
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Quotations (unchanged) */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#333333]">
            Recent Quotations
          </h2>
          <Link
            to="/quotations"
            className="text-xs text-[#1A3C34] hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {recentQuotations.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No quotations yet</p>
            <Link
              to="/quotations/create"
              className="inline-block mt-3 text-sm text-[#1A3C34] hover:underline"
            >
              Create your first quotation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Quotation #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Project
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">
                    Vendor
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
                </tr>
              </thead>
              <tbody>
                {recentQuotations.map((q) => {
                  const cfg = getStatusConfig(q.status);

                  return (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/quotations/${q.id}`)}
                      className="border-b border-[#F3F4F6] hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-medium text-[#1A3C34]">
                        {q.quotationNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {q.projectSnapshot?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {q.vendorSnapshot?.name || "-"}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#333333]">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(q.quotationDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Link
          to="/quotations/create"
          className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#1A3C34] transition-colors group"
        >
          <div className="w-9 h-9 bg-[#E8F0EE] rounded-md flex items-center justify-center group-hover:bg-[#D6E6E1]">
            <Plus className="w-4 h-4 text-[#1A3C34]" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#333333]">
              New Quotation
            </div>
            <div className="text-xs text-gray-400">Create a quotation</div>
          </div>
        </Link>
        <Link
          to="/projects"
          className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#1A3C34] transition-colors group"
        >
          <div className="w-9 h-9 bg-blue-50 rounded-md flex items-center justify-center group-hover:bg-blue-100">
            <FolderOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#333333]">Projects</div>
            <div className="text-xs text-gray-400">Manage projects</div>
          </div>
        </Link>

        <Link
          to="/vendors"
          className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-lg p-4 hover:border-[#1A3C34] transition-colors group"
        >
          <div className="w-9 h-9 bg-green-50 rounded-md flex items-center justify-center group-hover:bg-green-100">
            <Users className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <div className="text-sm font-medium text-[#333333]">Vendors</div>
            <div className="text-xs text-gray-400">Manage vendors</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

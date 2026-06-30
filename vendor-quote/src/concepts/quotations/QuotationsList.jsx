import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetQuotationsQuery,
  useSoftDeleteQuotationMutation,
} from "../../api/quotation.api";

import { useGetProjectsQuery } from "../../api/project.api";
import { useGetVendorsQuery } from "../../api/vendor.api";
import { useGetUsersQuery } from "../../api/user.api";

import {
  formatCurrency,
  formatDate,
  getStatusConfig,
} from "../../utils/helpers";
import { useAuth } from "../../store/use-auth";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  LayoutGrid,
  LayoutList,
  Trash2,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "resubmitted", label: "Resubmitted" },
  { value: "returned_for_editing", label: "Returned" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
];

export default function QuotationsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local filters state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    project_id: "",
    vendor_id: "",
    employee_id: "",
    from_date: "",
    to_date: "",
    page: 1,
    limit: 15,
  });

  const [view, setView] = useState(
    localStorage.getItem("quotations_view") || "list",
  );

  // ==================== SYNC URL PARAMS WITH FILTERS ====================

  // URL → Filters (This fixes sidebar links like ?status=approved)
  useEffect(() => {
    setFilters({
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "",
      project_id: searchParams.get("project_id") || "",
      vendor_id: searchParams.get("vendor_id") || "",
      employee_id: searchParams.get("employee_id") || "",
      from_date: searchParams.get("from_date") || "",
      to_date: searchParams.get("to_date") || "",
      page: parseInt(searchParams.get("page") || "1"),
      limit: 15,
    });
  }, [searchParams]);

  // Filters → URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set("search", filters.search);
    if (filters.status) params.set("status", filters.status);
    if (filters.project_id) params.set("project_id", filters.project_id);
    if (filters.vendor_id) params.set("vendor_id", filters.vendor_id);
    if (filters.employee_id) params.set("employee_id", filters.employee_id);
    if (filters.from_date) params.set("from_date", filters.from_date);
    if (filters.to_date) params.set("to_date", filters.to_date);
    if (filters.page > 1) params.set("page", filters.page);

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // ==================== RTK Query ====================
  const {
    data: quotationsData,
    isLoading,
    refetch,
  } = useGetQuotationsQuery({
    status: filters.status,
    project_id: filters.project_id,
    vendor_id: filters.vendor_id,
  });

  const { data: projectsData, isLoading: projectsLoading } =
    useGetProjectsQuery({
      status: "active",
      includeArchived: false,
    });

  const { data: vendorsData, isLoading: vendorsLoading } = useGetVendorsQuery({
    status: "active",
  });

  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({
    role: "employee",
    is_active: true,
  });

  const [deleteQuotation] = useSoftDeleteQuotationMutation();

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const setViewPref = (v) => {
    setView(v);
    localStorage.setItem("quotations_view", v);
  };

  const handleDelete = async (id, quotationNumber) => {
    if (
      !window.confirm(
        `Delete quotation ${quotationNumber}? This cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteQuotation({ id, deleted_by: user?.id }).unwrap();
      refetch();
    } catch (err) {
      console.error("Error deleting quotation:", err);
    }
  };

  // Normalize quotation data
  const normalizeQuotation = (q) => ({
    id: q.id,
    quotation_number: q.quotationNumber || q.quotation_number,
    quotation_date: q.quotationDate || q.quotation_date,
    status: q.status,
    project_name: q.projectSnapshot?.name || q.project_name,
    site_location: q.projectSnapshot?.site_location || q.site_location,
    vendor_name: q.vendorSnapshot?.name || q.vendor_name,
    total_amount: q.totalAmount || q.total_amount,
    current_version: q.current_version || 0,
    created_by: q.createdBy || q.created_by,
    created_by_name: q.created_by_name,
  });

  const rawQuotations = Array.isArray(quotationsData)
    ? quotationsData
    : quotationsData?.data || quotationsData?.quotations || [];

  const quotations = rawQuotations.map(normalizeQuotation);
  const total = quotationsData?.total || rawQuotations.length;
  const totalPages = Math.ceil(total / filters.limit);

  const projects = projectsData?.data || projectsData || [];
  const vendors = vendorsData?.data || vendorsData || [];
  const employees = usersData?.data || usersData || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#333333]">Quotations</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#E5E7EB] rounded-md overflow-hidden">
            <button
              onClick={() => setViewPref("list")}
              className={`p-2 ${view === "list" ? "bg-[#1A3C34] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewPref("grid")}
              className={`p-2 ${view === "grid" ? "bg-[#1A3C34] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            data-testid="create-quotation-btn"
            onClick={() => navigate("/quotations/create")}
            className="flex items-center gap-2 bg-[#1A3C34] text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Quotation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E7EB] rounded-lg p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              data-testid="quotation-search-input"
              placeholder="Search quotation, vendor, project..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34] focus:ring-1 focus:ring-[#1A3C34]"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.project_id}
            onChange={(e) => updateFilter("project_id", e.target.value)}
            disabled={projectsLoading}
            className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filters.vendor_id}
            onChange={(e) => updateFilter("vendor_id", e.target.value)}
            disabled={vendorsLoading}
            className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <input
            type="date"
            value={filters.from_date}
            onChange={(e) => updateFilter("from_date", e.target.value)}
            className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
          />
          <input
            type="date"
            value={filters.to_date}
            onChange={(e) => updateFilter("to_date", e.target.value)}
            className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
          />

          {user?.role === "ADMIN" && (
            <select
              value={filters.employee_id}
              onChange={(e) => updateFilter("employee_id", e.target.value)}
              disabled={usersLoading}
              className="py-2 px-3 text-sm border border-[#E5E7EB] rounded-md focus:outline-none focus:border-[#1A3C34]"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={
          view === "list"
            ? "bg-white border border-[#E5E7EB] rounded-lg overflow-hidden"
            : ""
        }
      >
        {view === "list" && (
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {total} quotation{total !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Loading quotations...
          </div>
        ) : quotations.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-400">No quotations found</p>
          </div>
        ) : view === "grid" ? (
          /* ==================== GRID VIEW ==================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {quotations.map((q) => {
              const cfg = getStatusConfig(q.status);
              return (
                <div
                  key={q.id}
                  onClick={() => navigate(`/quotations/${q.id}`)}
                  className="bg-white border border-[#E5E7EB] rounded-lg p-4 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div>
                      <div className="font-bold text-[#1A3C34] text-sm group-hover:text-red-700">
                        {q.quotation_number}
                      </div>
                      {q.current_version > 0 && (
                        <div className="text-xs text-gray-400">
                          V{q.current_version}
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="text-xs text-gray-400">
                      {formatDate(q.quotation_date)}
                    </div>
                    <div className="text-sm font-medium text-[#333333] truncate">
                      {q.project_name || "—"}
                    </div>
                    {q.site_location && (
                      <div className="text-xs text-gray-400 truncate">
                        {q.site_location}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 truncate">
                      {q.vendor_name || "—"}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                    <div className="text-sm font-bold text-[#333333]">
                      {formatCurrency(q.total_amount)}
                    </div>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(q.status === "draft" ||
                        q.status === "returned_for_editing") && (
                        <button
                          onClick={() => navigate(`/quotations/${q.id}/edit`)}
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(user?.role === "ADMIN" ||
                        ((q.status === "draft" ||
                          q.status === "returned_for_editing") &&
                          q.created_by === user?.id)) && (
                        <button
                          onClick={() => handleDelete(q.id, q.quotation_number)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================== LIST VIEW ==================== */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Quotation #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  {user?.role === "ADMIN" && (
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                  )}
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1A3C34]">
                          {q.quotation_number}
                        </div>
                        {q.current_version > 0 && (
                          <div className="text-xs text-gray-400">
                            V{q.current_version}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(q.quotation_date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[#333333] font-medium">
                          {q.project_name || "-"}
                        </div>
                        <div className="text-xs text-gray-400">
                          {q.site_location}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {q.vendor_name || "-"}
                      </td>
                      {user?.role === "ADMIN" && (
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {q.created_by_name || "-"}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-[#333333] whitespace-nowrap">
                        {formatCurrency(q.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/quotations/${q.id}`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#333333]"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => navigate(`/quotations/${q.id}/edit`)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-[#333333]"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {(user?.role === "ADMIN" ||
                            ((q.status === "draft" ||
                              q.status === "returned_for_editing") &&
                              q.created_by === user?.id)) && (
                            <button
                              onClick={() =>
                                handleDelete(q.id, q.quotation_number)
                              }
                              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className={`px-4 py-3 flex items-center justify-between ${view === "list" ? "border-t border-[#E5E7EB]" : "mt-4"}`}
          >
            <span className="text-xs text-gray-500">
              Page {filters.page} of {totalPages} ({total} total)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
                disabled={filters.page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
                disabled={filters.page >= totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

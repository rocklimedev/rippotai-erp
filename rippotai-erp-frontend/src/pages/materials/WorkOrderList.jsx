import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetWorkOrdersQuery,
  useDeleteWorkOrderMutation,
} from "../../api/procuerment/work-order.api";

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
  "CLOSED",
];

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  PARTIALLY_RECEIVED: "bg-violet-50 text-violet-700 border-violet-200",
  RECEIVED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  CLOSED: "bg-gray-100 text-gray-700 border-gray-200",
};

const formatStatus = (status) => {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const getRows = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.rows)) return response.rows;
  if (Array.isArray(response?.results)) return response.results;

  return [];
};

const getTotal = (response, rows) => {
  return (
    response?.total ??
    response?.count ??
    response?.meta?.total ??
    response?.pagination?.total ??
    rows.length
  );
};

const getWorkOrderNumber = (workOrder) =>
  workOrder?.work_order_number ||
  workOrder?.workOrderNumber ||
  workOrder?.wo_number ||
  workOrder?.woNumber ||
  workOrder?.number ||
  `WO-${String(workOrder?.id || "").slice(0, 8)}`;

const getProjectName = (workOrder) =>
  workOrder?.project?.name ||
  workOrder?.project?.project_name ||
  workOrder?.project_name ||
  workOrder?.projectName ||
  "-";

const getVendorName = (workOrder) =>
  workOrder?.vendor?.name ||
  workOrder?.vendor?.company_name ||
  workOrder?.vendor_name ||
  workOrder?.vendorName ||
  "-";

const getTotalAmount = (workOrder) =>
  workOrder?.grand_total ??
  workOrder?.total_amount ??
  workOrder?.totalAmount ??
  workOrder?.net_amount ??
  workOrder?.amount ??
  0;

export default function WorkOrderList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: PAGE_SIZE,
    };

    if (search.trim()) {
      params.search = search.trim();
    }

    if (status !== "ALL") {
      params.status = status;
    }

    return params;
  }, [page, search, status]);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetWorkOrdersQuery(queryParams);

  const [deleteWorkOrder, { isLoading: isDeleting }] =
    useDeleteWorkOrderMutation();

  const rows = getRows(data);
  const total = getTotal(data, rows);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteWorkOrder(deleteId).unwrap();

      toast.success("Work order deleted successfully");
      setDeleteId(null);

      if (rows.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to delete work order",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEEF0] p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F453B] text-white">
                <FileText size={20} />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Work Orders
                </h1>
                <p className="text-sm text-slate-500">
                  Manage vendor work orders and execution commitments.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/procurement/work-order/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1F453B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#17382f]"
          >
            <Plus size={18} />
            Create Work Order
          </button>
        </div>

        {/* Filters */}
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search work order, project or vendor..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={status}
              onChange={handleStatusChange}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1F453B] focus:ring-2 focus:ring-[#1F453B]/10"
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item === "ALL" ? "All Statuses" : formatStatus(item)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw
                size={16}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {isLoading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading work orders...
              </div>
            </div>
          ) : isError ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-600">
                Unable to load work orders.
              </p>

              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Try Again
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FileText size={24} className="text-slate-400" />
              </div>

              <div>
                <h3 className="font-medium text-slate-800">
                  No work orders found
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Create your first work order to get started.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/work-orders/new")}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={16} />
                Create Work Order
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Work Order
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Project
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Vendor
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Date
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rows.map((workOrder) => {
                      const id = workOrder.id;
                      const currentStatus = workOrder.status || "DRAFT";

                      return (
                        <tr
                          key={id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => navigate(`/work-orders/${id}`)}
                              className="font-semibold text-[#1F453B] hover:underline"
                            >
                              {getWorkOrderNumber(workOrder)}
                            </button>

                            {workOrder.title && (
                              <p className="mt-1 max-w-[240px] truncate text-xs text-slate-500">
                                {workOrder.title}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {getProjectName(workOrder)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-700">
                            {getVendorName(workOrder)}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              workOrder.work_order_date ||
                                workOrder.workOrderDate ||
                                workOrder.date ||
                                workOrder.createdAt,
                            )}
                          </td>

                          <td className="px-5 py-4 text-right text-sm font-semibold text-slate-800">
                            {formatCurrency(getTotalAmount(workOrder))}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                                STATUS_STYLES[currentStatus] ||
                                "border-slate-200 bg-slate-100 text-slate-700"
                              }`}
                            >
                              {formatStatus(currentStatus)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="View"
                                onClick={() =>
                                  navigate(`/procurement/work-order/${id}`)
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F453B]"
                              >
                                <Eye size={17} />
                              </button>

                              <button
                                type="button"
                                title="Edit"
                                onClick={() =>
                                  navigate(`/procurement/work-order/${id}/edit`)
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-[#1F453B]"
                              >
                                <Pencil size={17} />
                              </button>

                              <button
                                type="button"
                                title="Delete"
                                onClick={() => setDeleteId(id)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={17} />
                              </button>

                              <button
                                type="button"
                                title="More"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                              >
                                <MoreHorizontal size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-700">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>{" "}
                  of <span className="font-medium text-slate-700">{total}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <span className="min-w-[80px] text-center text-sm text-slate-600">
                    Page {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete Work Order?
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

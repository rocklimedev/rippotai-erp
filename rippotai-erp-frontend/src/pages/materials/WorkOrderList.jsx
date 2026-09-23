import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Check,
  Ban,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetWorkOrdersQuery,
  useDeleteWorkOrderMutation,
  useApproveWorkOrderMutation,
  useRejectWorkOrderMutation,
  useUpdateWorkOrderStatusMutation,
} from "../../api/procuerment/work-order.api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_OPTIONS = [
  "ALL",
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "ISSUED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "CLOSED",
];

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  DRAFT: "border-slate-200 bg-slate-100 text-slate-700",

  PENDING_APPROVAL: "border-amber-200 bg-amber-50 text-amber-700",

  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",

  ISSUED: "border-blue-200 bg-blue-50 text-blue-700",

  ACKNOWLEDGED: "border-cyan-200 bg-cyan-50 text-cyan-700",

  IN_PROGRESS: "border-violet-200 bg-violet-50 text-violet-700",

  COMPLETED: "border-green-200 bg-green-50 text-green-700",

  CANCELLED: "border-red-200 bg-red-50 text-red-700",

  CLOSED: "border-gray-200 bg-gray-100 text-gray-700",
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

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
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  if (Array.isArray(response?.rows)) {
    return response.rows;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

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
  workOrder?.wo_id ||
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
  workOrder?.contractor_company_name ||
  workOrder?.vendor_name ||
  workOrder?.vendorName ||
  "-";

const getTotalAmount = (workOrder) =>
  workOrder?.total_amount ??
  workOrder?.grand_total ??
  workOrder?.totalAmount ??
  workOrder?.net_amount ??
  workOrder?.amount ??
  0;

const canEdit = (status) => status !== "CLOSED" && status !== "CANCELLED";

const canDelete = (status) =>
  status === "DRAFT" || status === "PENDING_APPROVAL" || status === "APPROVED";

export default function WorkOrderList() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState(null);

  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit: PAGE_SIZE,
    };

    /*
     * IMPORTANT:
     * Your current backend findAll() only accepts:
     * project_id
     * vendor_id
     * status
     *
     * It does NOT currently implement search/page/limit.
     *
     * Keeping these here is okay if you add pagination/search
     * to the backend later.
     */

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

  const [approveWorkOrder, { isLoading: isApproving }] =
    useApproveWorkOrderMutation();

  const [rejectWorkOrder, { isLoading: isRejecting }] =
    useRejectWorkOrderMutation();

  const [updateWorkOrderStatus, { isLoading: isUpdatingStatus }] =
    useUpdateWorkOrderStatusMutation();

  const rows = getRows(data);
  const total = getTotal(data, rows);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ============================================================
  // SEARCH
  // ============================================================

  const filteredRows = useMemo(() => {
    if (!search.trim()) {
      return rows;
    }

    const searchValue = search.trim().toLowerCase();

    return rows.filter((workOrder) => {
      const values = [
        getWorkOrderNumber(workOrder),
        getProjectName(workOrder),
        getVendorName(workOrder),
        workOrder?.status,
        workOrder?.project_name,
        workOrder?.contractor_company_name,
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(searchValue),
      );
    });
  }, [rows, search]);

  // ============================================================
  // DELETE
  // ============================================================

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

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApprove = async (id) => {
    try {
      await approveWorkOrder(id).unwrap();

      toast.success("Work order approved successfully");
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to approve work order",
      );
    }
  };

  // ============================================================
  // REJECT
  // ============================================================

  const handleReject = async () => {
    if (!rejectId) return;

    try {
      await rejectWorkOrder({
        id: rejectId,
        reason: rejectReason.trim() || undefined,
      }).unwrap();

      toast.success("Work order rejected and returned to draft");

      setRejectId(null);
      setRejectReason("");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to reject work order",
      );
    }
  };

  // ============================================================
  // STATUS
  // ============================================================

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await updateWorkOrderStatus({
        id,
        status: nextStatus,
      }).unwrap();

      toast.success(`Work order moved to ${formatStatus(nextStatus)}`);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to update work order status",
      );
    }
  };

  // ============================================================
  // EMPTY ACTION
  // ============================================================

  const handleClearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setPage(1);
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#EAEEF0] p-4 md:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* ======================================================
            HEADER
        ====================================================== */}

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F453B] text-white">
                  <FileText className="h-5 w-5" />
                </div>

                <div>
                  <CardTitle className="text-xl">Work Orders</CardTitle>

                  <CardDescription>
                    Manage vendor work orders, approvals and execution.
                  </CardDescription>
                </div>
              </div>

              <Button
                onClick={() => navigate("/procurement/work-order/new")}
                className="bg-[#1F453B] hover:bg-[#17382f]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Work Order
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* ======================================================
            FILTERS
        ====================================================== */}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search work order, project or vendor..."
                  className="pl-9 pr-9"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full lg:w-[220px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  {STATUS_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item === "ALL" ? "All Statuses" : formatStatus(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>

              {(search || status !== "ALL") && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ======================================================
            TABLE
        ====================================================== */}

        <Card className="overflow-hidden border-0 shadow-sm">
          {isLoading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading work orders...
              </div>
            </div>
          ) : isError ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3">
              <XCircle className="h-10 w-10 text-red-500" />

              <p className="text-sm text-red-600">
                Unable to load work orders.
              </p>

              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>

              <div>
                <h3 className="font-medium text-slate-800">
                  No work orders found
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {search || status !== "ALL"
                    ? "Try changing your filters."
                    : "Create your first work order to get started."}
                </p>
              </div>

              {search || status !== "ALL" ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/procurement/work-order/new")}
                  className="bg-[#1F453B] hover:bg-[#17382f]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Work Order
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Work Order
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Project
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Vendor
                      </th>

                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {filteredRows.map((workOrder) => {
                      const id = workOrder.id;

                      const currentStatus = workOrder.status || "DRAFT";

                      return (
                        <tr
                          key={id}
                          className="transition-colors hover:bg-muted/30"
                        >
                          {/* WORK ORDER */}

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/procurement/work-order/${id}`)
                              }
                              className="font-semibold text-[#1F453B] hover:underline"
                            >
                              {getWorkOrderNumber(workOrder)}
                            </button>

                            {workOrder.title && (
                              <p className="mt-1 max-w-[240px] truncate text-xs text-muted-foreground">
                                {workOrder.title}
                              </p>
                            )}
                          </td>

                          {/* PROJECT */}

                          <td className="px-5 py-4 text-sm">
                            {getProjectName(workOrder)}
                          </td>

                          {/* VENDOR */}

                          <td className="px-5 py-4 text-sm">
                            {getVendorName(workOrder)}
                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4 text-sm text-muted-foreground">
                            {formatDate(
                              workOrder.work_order_date ||
                                workOrder.workOrderDate ||
                                workOrder.date ||
                                workOrder.created_at ||
                                workOrder.createdAt,
                            )}
                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4 text-right text-sm font-semibold">
                            {formatCurrency(getTotalAmount(workOrder))}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4 text-center">
                            <Badge
                              variant="outline"
                              className={
                                STATUS_STYLES[currentStatus] ||
                                "border-slate-200 bg-slate-100 text-slate-700"
                              }
                            >
                              {formatStatus(currentStatus)}
                            </Badge>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {/* VIEW */}

                              <Button
                                variant="ghost"
                                size="icon"
                                title="View"
                                onClick={() =>
                                  navigate(`/procurement/work-order/${id}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {/* EDIT */}

                              {canEdit(currentStatus) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit"
                                  onClick={() =>
                                    navigate(
                                      `/procurement/work-order/${id}/edit`,
                                    )
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              )}

                              {/* MORE */}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={
                                      isApproving ||
                                      isRejecting ||
                                      isUpdatingStatus
                                    }
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  align="end"
                                  className="w-56"
                                >
                                  {/* DRAFT ACTIONS */}

                                  {currentStatus === "DRAFT" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(
                                            id,
                                            "PENDING_APPROVAL",
                                          )
                                        }
                                      >
                                        <Send className="mr-2 h-4 w-4" />
                                        Submit for Approval
                                      </DropdownMenuItem>

                                      <DropdownMenuSeparator />
                                    </>
                                  )}

                                  {/* APPROVAL ACTIONS */}

                                  {currentStatus === "PENDING_APPROVAL" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => handleApprove(id)}
                                      >
                                        <Check className="mr-2 h-4 w-4 text-emerald-600" />
                                        Approve
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() => {
                                          setRejectId(id);
                                          setRejectReason("");
                                        }}
                                      >
                                        <Ban className="mr-2 h-4 w-4 text-red-600" />
                                        Reject
                                      </DropdownMenuItem>

                                      <DropdownMenuSeparator />
                                    </>
                                  )}

                                  {/* APPROVED */}

                                  {currentStatus === "APPROVED" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(id, "ISSUED")
                                      }
                                    >
                                      <Send className="mr-2 h-4 w-4" />
                                      Issue Work Order
                                    </DropdownMenuItem>
                                  )}

                                  {/* ISSUED */}

                                  {currentStatus === "ISSUED" && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(id, "ACKNOWLEDGED")
                                        }
                                      >
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Mark Acknowledged
                                      </DropdownMenuItem>

                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleStatusChange(id, "IN_PROGRESS")
                                        }
                                      >
                                        <Play className="mr-2 h-4 w-4" />
                                        Start Work
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* ACKNOWLEDGED */}

                                  {currentStatus === "ACKNOWLEDGED" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(id, "IN_PROGRESS")
                                      }
                                    >
                                      <Play className="mr-2 h-4 w-4" />
                                      Start Work
                                    </DropdownMenuItem>
                                  )}

                                  {/* IN PROGRESS */}

                                  {currentStatus === "IN_PROGRESS" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(id, "COMPLETED")
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" />
                                      Mark Completed
                                    </DropdownMenuItem>
                                  )}

                                  {/* COMPLETED */}

                                  {currentStatus === "COMPLETED" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(id, "CLOSED")
                                      }
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Close Work Order
                                    </DropdownMenuItem>
                                  )}

                                  {/* CANCEL */}

                                  {[
                                    "DRAFT",
                                    "PENDING_APPROVAL",
                                    "APPROVED",
                                    "ISSUED",
                                    "ACKNOWLEDGED",
                                    "IN_PROGRESS",
                                  ].includes(currentStatus) && (
                                    <>
                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() =>
                                          handleStatusChange(id, "CANCELLED")
                                        }
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Work Order
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {/* DELETE */}

                                  {canDelete(currentStatus) && (
                                    <>
                                      <DropdownMenuSeparator />

                                      <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => setDeleteId(id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ==================================================
                  PAGINATION
              ================================================== */}

              <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {(page - 1) * PAGE_SIZE + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">{total}</span>
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="min-w-[100px] text-center text-sm text-muted-foreground">
                    Page {page} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ========================================================
          DELETE CONFIRMATION
      ======================================================== */}

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Order?</AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. The work order and its related
              items, payment stages and terms will be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========================================================
          REJECT DIALOG
      ======================================================== */}

      <Dialog
        open={Boolean(rejectId)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectId(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Work Order</DialogTitle>

            <DialogDescription>
              The work order will be returned to DRAFT so it can be corrected
              and submitted again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rejection Reason
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </label>

            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectId(null);
                setRejectReason("");
              }}
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={isRejecting}
              onClick={handleReject}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Reject Work Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

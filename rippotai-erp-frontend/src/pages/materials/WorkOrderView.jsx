import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  Send,
  FileText,
  Loader2,
  Play,
  CircleCheck,
  LockKeyhole,
  Ban,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";

import WorkOrderDocument from "../../components/work-orders/WorkOrderDocument";
import { downloadWorkOrderPdf } from "../../components/work-orders/workOrderPdf";
import {
  getWorkOrderNumber,
  getProjectName,
  getVendorName,
} from "../../components/work-orders/workOrderFormat";

import {
  useGetWorkOrderQuery,
  useDeleteWorkOrderMutation,
  useUpdateWorkOrderStatusMutation,
} from "../../api/procuerment/work-order.api";

// shadcn/ui
import { Button } from "@/components/ui/button";
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const formatStatus = (status) =>
  String(status || "-")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

/**
 * Real WorkOrder status flow.
 *
 * These actions intentionally use:
 *
 * PATCH /work-orders/:id/status
 *
 * There are no separate /approve or /reject APIs.
 */
const STATUS_ACTIONS = {
  DRAFT: {
    nextStatus: "PENDING_APPROVAL",
    label: "Submit for Approval",
    icon: Send,
    description:
      "Submit this work order for approval. It will move to Pending Approval.",
  },

  PENDING_APPROVAL: {
    nextStatus: "APPROVED",
    label: "Approve Work Order",
    icon: CheckCircle2,
    description: "Approve this work order and move it to the Approved status.",
  },

  APPROVED: {
    nextStatus: "ISSUED",
    label: "Issue Work Order",
    icon: Send,
    description: "Issue this approved work order to the vendor.",
  },

  ISSUED: {
    nextStatus: "ACKNOWLEDGED",
    label: "Mark Acknowledged",
    icon: ClipboardCheck,
    description: "Mark the work order as acknowledged by the vendor.",
  },

  ACKNOWLEDGED: {
    nextStatus: "IN_PROGRESS",
    label: "Start Work",
    icon: Play,
    description: "Mark the work order as currently in progress.",
  },

  IN_PROGRESS: {
    nextStatus: "COMPLETED",
    label: "Mark Completed",
    icon: CircleCheck,
    description: "Mark the work order as completed.",
  },

  COMPLETED: {
    nextStatus: "CLOSED",
    label: "Close Work Order",
    icon: LockKeyhole,
    description: "Close this completed work order.",
  },
};

const CANCELLABLE_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "ISSUED",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
];

export default function WorkOrderView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const documentRef = useRef(null);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [statusDialog, setStatusDialog] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetWorkOrderQuery(id, {
    skip: !id,
  });

  const [deleteWorkOrder, { isLoading: isDeleting }] =
    useDeleteWorkOrderMutation();

  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateWorkOrderStatusMutation();

  const workOrder = response?.data || response?.workOrder || response;

  const status = workOrder?.status || "DRAFT";

  const statusAction = STATUS_ACTIONS[status];

  const canCancel = CANCELLABLE_STATUSES.includes(status);

  const handlePrint = () => {
    if (documentRef.current?.querySelector('[data-ready="true"]')) {
      window.print();
    } else {
      toast.info("Please wait for the document to finish loading.");
    }
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current || isGeneratingPdf) return;

    if (!documentRef.current.querySelector('[data-ready="true"]')) {
      toast.info("Please wait for the document to finish loading.");
      return;
    }

    try {
      setIsGeneratingPdf(true);

      toast.loading("Preparing PDF...", {
        id: "work-order-pdf",
      });

      await downloadWorkOrderPdf(
        documentRef.current,
        getWorkOrderNumber(workOrder),
      );

      toast.success("PDF downloaded", {
        id: "work-order-pdf",
      });
    } catch (error) {
      console.error(error);

      toast.error("Unable to generate PDF. Please try again.", {
        id: "work-order-pdf",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Real status update:
   *
   * PATCH /work-orders/:id/status
   *
   * body:
   * {
   *   status: "APPROVED"
   * }
   */
  const handleStatusUpdate = async () => {
    if (!statusDialog?.nextStatus) return;

    try {
      await updateStatus({
        id,
        status: statusDialog.nextStatus,
      }).unwrap();

      toast.success(
        `Work order marked ${formatStatus(statusDialog.nextStatus)}`,
      );

      setStatusDialog(null);

      refetch();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to update work order status",
      );
    }
  };

  const openStatusDialog = (
    nextStatus,
    label,
    description,
    destructive = false,
  ) => {
    setStatusDialog({
      nextStatus,
      label,
      description,
      destructive,
    });
  };

  const handleDelete = async () => {
    try {
      await deleteWorkOrder(id).unwrap();

      toast.success("Work order deleted");

      setDeleteDialogOpen(false);

      navigate("/work-orders");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to delete work order",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAEEF0]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={20} className="animate-spin" />
          Loading work order...
        </div>
      </div>
    );
  }

  if (isError || !workOrder) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#EAEEF0]">
        <FileText size={42} className="text-slate-300" />

        <p className="text-sm text-slate-500">
          Unable to load this work order.
        </p>

        <Button
          type="button"
          onClick={() => refetch()}
          className="bg-[#1F453B] hover:bg-[#17382f]"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="work-order-view min-h-screen bg-[#EAEEF0] p-4 md:p-6 print:bg-white print:p-0">
        <div className="mx-auto max-w-[1200px]">
          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => navigate("/work-orders")}
                className="shrink-0 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate font-semibold text-slate-900">
                    {getWorkOrderNumber(workOrder)}
                  </h1>

                  <Badge
                    variant="outline"
                    className={
                      STATUS_STYLES[status] ||
                      "border-slate-200 bg-slate-100 text-slate-700"
                    }
                  >
                    {formatStatus(status)}
                  </Badge>
                </div>

                <p className="truncate text-sm text-slate-500">
                  {workOrder.title ||
                    `${getProjectName(workOrder)} • ${getVendorName(
                      workOrder,
                    )}`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Primary status action */}
              {statusAction && (
                <Button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() =>
                    openStatusDialog(
                      statusAction.nextStatus,
                      statusAction.label,
                      statusAction.description,
                    )
                  }
                  className={
                    status === "PENDING_APPROVAL"
                      ? "bg-[#1F453B] hover:bg-[#17382f]"
                      : ""
                  }
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <statusAction.icon className="mr-2 h-4 w-4" />
                  )}

                  {statusAction.label}
                </Button>
              )}

              {/* More actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUpdatingStatus || isDeleting}
                  >
                    Actions
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  {/* Status transition */}
                  {statusAction && (
                    <DropdownMenuItem
                      onSelect={() =>
                        openStatusDialog(
                          statusAction.nextStatus,
                          statusAction.label,
                          statusAction.description,
                        )
                      }
                    >
                      <statusAction.icon className="mr-2 h-4 w-4" />
                      {statusAction.label}
                    </DropdownMenuItem>
                  )}

                  {/* Cancel */}
                  {canCancel && (
                    <>
                      {statusAction && <DropdownMenuSeparator />}

                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onSelect={() =>
                          openStatusDialog(
                            "CANCELLED",
                            "Cancel Work Order",
                            "This will move the work order to Cancelled status.",
                            true,
                          )
                        }
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel Work Order
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onSelect={() => navigate(`/work-orders/${id}/edit`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Work Order
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled={isGeneratingPdf}
                    onSelect={handleDownloadPdf}
                  >
                    {isGeneratingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download PDF
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Work Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Preview / Print / PDF */}
          <div ref={documentRef}>
            <WorkOrderDocument workOrder={workOrder} />
          </div>
        </div>
      </div>

      {/* Status Confirmation */}
      <AlertDialog
        open={Boolean(statusDialog)}
        onOpenChange={(open) => {
          if (!open && !isUpdatingStatus) {
            setStatusDialog(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialog?.label || "Update Work Order"}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {statusDialog?.description ||
                "Are you sure you want to update this work order status?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isUpdatingStatus}
              className={
                statusDialog?.destructive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#1F453B] hover:bg-[#17382f]"
              }
              onClick={async (event) => {
                event.preventDefault();
                await handleStatusUpdate();
              }}
            >
              {isUpdatingStatus && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {isUpdatingStatus
                ? "Updating..."
                : statusDialog?.label || "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setDeleteDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Order?</AlertDialogTitle>

            <AlertDialogDescription>
              This action cannot be undone. The work order{" "}
              <span className="font-medium text-slate-900">
                {getWorkOrderNumber(workOrder)}
              </span>{" "}
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
              onClick={async (event) => {
                event.preventDefault();
                await handleDelete();
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {isDeleting ? "Deleting..." : "Delete Work Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

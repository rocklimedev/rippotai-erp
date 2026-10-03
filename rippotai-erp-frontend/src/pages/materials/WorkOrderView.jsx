import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Pencil,
  MoreHorizontal,
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

import WorkOrderPrintDocument from "../../components/commerce-documents/WorkOrderPrintDocument";
import { DocumentPreview } from "@/components/print-document";
import { Page, PageHeader, EmptyState, StatusPill, Button as InosButton } from "@/components/inos";
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

  const handleDownloadPdf = async () => {
    if (!documentRef.current || isGeneratingPdf) return;

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

      navigate("/procurement/work-order/all");
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to delete work order",
      );
    }
  };

  const crumbs = [
    { label: "Procurement", to: "/procurement" },
    { label: "Work orders", to: "/procurement/work-order/all" },
    { label: workOrder ? getWorkOrderNumber(workOrder) : "Work order" },
  ];

  if (isLoading) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Work order" subtitle="Loading…" />
      </Page>
    );
  }

  if (isError || !workOrder) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Work order" />
        <div className="inos-card">
          <EmptyState
            icon={FileText}
            title="Unable to load this work order"
            text="It may have been deleted, or the server is unavailable."
            action={
              <InosButton variant="primary" onClick={() => refetch()}>
                Try again
              </InosButton>
            }
          />
        </div>
      </Page>
    );
  }

  return (
    <>
      <Page>
        <PageHeader
          crumbs={crumbs}
          title={getWorkOrderNumber(workOrder)}
          subtitle={
            <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {workOrder.title || `${getProjectName(workOrder)} · ${getVendorName(workOrder)}`}
              <StatusPill status={String(status).toLowerCase()} size="sm" />
            </span>
          }
          actions={
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <InosButton variant="ghost" icon={MoreHorizontal} disabled={isUpdatingStatus || isDeleting} aria-label="More actions" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {canCancel && (
                    <DropdownMenuItem
                      onSelect={() =>
                        openStatusDialog("CANCELLED", "Cancel Work Order", "This will move the work order to Cancelled status.", true)
                      }
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel work order
                    </DropdownMenuItem>
                  )}
                  {canCancel && <DropdownMenuSeparator />}
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete work order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <InosButton variant="secondary" icon={Pencil} onClick={() => navigate(`/procurement/work-order/${id}/edit`)}>
                Edit
              </InosButton>
              {statusAction && (
                <InosButton
                  variant="soft"
                  icon={statusAction.icon}
                  disabled={isUpdatingStatus}
                  onClick={() => openStatusDialog(statusAction.nextStatus, statusAction.label, statusAction.description)}
                >
                  {statusAction.label}
                </InosButton>
              )}
              <InosButton variant="primary" icon={Download} loading={isGeneratingPdf} onClick={handleDownloadPdf}>
                Download PDF
              </InosButton>
            </>
          }
        />

        <DocumentPreview>
          <div ref={documentRef}>
            <WorkOrderPrintDocument workOrder={workOrder} />
          </div>
        </DocumentPreview>
      </Page>

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

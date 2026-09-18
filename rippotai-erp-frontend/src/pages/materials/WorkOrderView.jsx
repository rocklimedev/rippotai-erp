import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Printer,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Loader2,
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
  useApproveWorkOrderMutation,
  useRejectWorkOrderMutation,
} from "../../api/procuerment/work-order.api";

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

const formatStatus = (status) =>
  String(status || "-")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function WorkOrderView() {
  const navigate = useNavigate();
  const { id } = useParams();

  const documentRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  const [approveWorkOrder, { isLoading: isApproving }] =
    useApproveWorkOrderMutation();

  const [rejectWorkOrder, { isLoading: isRejecting }] =
    useRejectWorkOrderMutation();

  const workOrder = response?.data || response?.workOrder || response;

  const handlePrint = () => {
    if (documentRef.current?.querySelector('[data-ready="true"]'))
      window.print();
    else toast.info("Please wait for the document to finish loading.");
  };

  const handleDownloadPdf = async () => {
    if (!documentRef.current || isGeneratingPdf) return;
    if (!documentRef.current.querySelector('[data-ready="true"]')) {
      toast.info("Please wait for the document to finish loading.");
      return;
    }
    try {
      setIsGeneratingPdf(true);
      toast.loading("Preparing PDF...", { id: "work-order-pdf" });
      await downloadWorkOrderPdf(
        documentRef.current,
        getWorkOrderNumber(workOrder),
      );
      toast.success("PDF downloaded", { id: "work-order-pdf" });
    } catch (error) {
      console.error(error);
      toast.error("Unable to generate PDF. Please try again.", {
        id: "work-order-pdf",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleStatus = async (status) => {
    try {
      await updateStatus({
        id,
        status,
      }).unwrap();

      toast.success(`Work order marked ${formatStatus(status)}`);

      refetch();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to update status",
      );
    }
  };

  const handleApprove = async () => {
    try {
      await approveWorkOrder(id).unwrap();

      toast.success("Work order approved");

      refetch();
    } catch (error) {
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Unable to approve work order",
      );
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Enter rejection reason (optional):");

    try {
      await rejectWorkOrder({
        id,
        ...(reason ? { reason } : {}),
      }).unwrap();

      toast.success("Work order rejected");

      refetch();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.message || "Unable to reject work order",
      );
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this work order?",
    );

    if (!confirmed) return;

    try {
      await deleteWorkOrder(id).unwrap();

      toast.success("Work order deleted");

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

        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-xl bg-[#1F453B] px-4 py-2 text-sm font-medium text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  const status = workOrder.status || "DRAFT";

  return (
    <div className="work-order-view min-h-screen bg-[#EAEEF0] p-4 md:p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1200px]">
        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm print:hidden lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/work-orders")}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-slate-900">
                  {getWorkOrderNumber(workOrder)}
                </h1>

                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                    STATUS_STYLES[status] ||
                    "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  {formatStatus(status)}
                </span>
              </div>

              <p className="text-sm text-slate-500">
                {workOrder.title ||
                  `${getProjectName(workOrder)} • ${getVendorName(workOrder)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {status === "DRAFT" && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatus("PENDING_APPROVAL")}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                <Send size={16} />
                Submit
              </button>
            )}

            {status === "PENDING_APPROVAL" && (
              <>
                <button
                  type="button"
                  disabled={isRejecting}
                  onClick={handleReject}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  <XCircle size={16} />
                  Reject
                </button>

                <button
                  type="button"
                  disabled={isApproving}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1F453B] px-3 py-2 text-sm font-medium text-white hover:bg-[#17382f]"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
              </>
            )}

            {status === "APPROVED" && (
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={() => handleStatus("SENT")}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Send size={16} />
                Mark Sent
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(`/work-orders/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer size={16} />
              Print
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {isGeneratingPdf ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isGeneratingPdf ? "Generating PDF…" : "PDF"}
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        {/* Preview, printing and download use the same paginated document. */}
        <div ref={documentRef}>
          <WorkOrderDocument workOrder={workOrder} />
        </div>
      </div>
    </div>
  );
}

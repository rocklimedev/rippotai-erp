import React, { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Ban, Check, ChevronDown, Download, Edit3, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Page, PageHeader, Button, EmptyState, StatusPill, TextArea } from "@/components/inos";
import { DocumentPreview, usePdfDownload } from "@/components/print-document";
import PurchaseOrderDocument, { purchaseOrderFileName } from "@/components/commerce-documents/PurchaseOrderDocument";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useGetPurchaseOrderQuery,
  useUpdatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
} from "../../api/procuerment/purchase-order.api";
import { useGetProjectByIdQuery } from "../../api/projects/project.api";

const STATUS_OPTIONS = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
];

const pretty = (s) => String(s || "").replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
const errMsg = (e, fallback) => e?.data?.message || e?.message || fallback;

// Purchase order viewer: the A4 pages the vendor receives, plus the approval actions.
export default function PurchaseOrderView() {
  const { id } = useParams();
  const nav = useNavigate();
  const docRef = useRef(null);
  const { download, downloading } = usePdfDownload(docRef);

  const [dialog, setDialog] = useState(null); // "APPROVE" | "REJECT" | "CANCEL"
  const [reason, setReason] = useState("");

  const { data: poResponse, isLoading, isError, refetch } = useGetPurchaseOrderQuery(id, { skip: !id });
  const po = poResponse?.data && !Array.isArray(poResponse.data) ? poResponse.data : poResponse;
  const { data: projectResponse } = useGetProjectByIdQuery(po?.project_id, { skip: !po?.project_id });
  const project = projectResponse?.data || projectResponse;

  const [updatePurchaseOrder, { isLoading: updating }] = useUpdatePurchaseOrderMutation();
  const [approvePurchaseOrder, { isLoading: approving }] = useApprovePurchaseOrderMutation();
  const [cancelPurchaseOrder, { isLoading: cancelling }] = useCancelPurchaseOrderMutation();
  const busy = updating || approving || cancelling;

  const status = String(po?.status || "DRAFT").toUpperCase();
  const canApprove = ["DRAFT", "PENDING_APPROVAL", "REJECTED"].includes(status);
  const canReject = ["DRAFT", "PENDING_APPROVAL"].includes(status);
  const canCancel = !["CANCELLED", "RECEIVED"].includes(status);

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    setReason("");
  };

  const run = async (fn, ok, fail) => {
    try {
      await fn();
      toast.success(ok);
      setDialog(null);
      setReason("");
      refetch();
    } catch (e) {
      console.error(fail, e);
      toast.error(errMsg(e, fail));
    }
  };

  const setStatus = (next) =>
    next !== status &&
    run(() => updatePurchaseOrder({ id: po.id, status: next }).unwrap(), `Status updated to ${pretty(next).toLowerCase()}.`, "Unable to update the status.");

  const confirmDialog = () => {
    if (dialog === "APPROVE") return run(() => approvePurchaseOrder(po.id).unwrap(), "Purchase order approved.", "Unable to approve the purchase order.");
    if (dialog === "REJECT") {
      if (!reason.trim()) return toast.error("Please enter a rejection reason.");
      return run(
        () => updatePurchaseOrder({ id: po.id, status: "REJECTED", rejection_reason: reason.trim() }).unwrap(),
        "Purchase order rejected.",
        "Unable to reject the purchase order.",
      );
    }
    if (dialog === "CANCEL") return run(() => cancelPurchaseOrder(po.id).unwrap(), "Purchase order cancelled.", "Unable to cancel the purchase order.");
  };

  const crumbs = [
    { label: "Procurement", to: "/procurement" },
    { label: "Purchase orders", to: "/procurement/purchase-orders" },
    { label: po?.po_number || "Purchase order" },
  ];

  if (isLoading) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Purchase order" subtitle="Loading…" />
      </Page>
    );
  }

  if (isError || !po) {
    return (
      <Page>
        <PageHeader crumbs={crumbs} title="Purchase order" />
        <div className="inos-card">
          <EmptyState
            icon={FileText}
            title="Purchase order not found"
            text="It may have been deleted or is not available."
            action={<Button variant="primary" onClick={() => nav("/procurement/purchase-orders")}>Back to purchase orders</Button>}
          />
        </div>
      </Page>
    );
  }

  const dialogCopy = {
    APPROVE: { title: "Approve purchase order?", text: `${po.po_number} will be marked as approved and can be sent to the vendor.`, cta: "Approve" },
    REJECT: { title: "Reject purchase order?", text: `Tell the team why ${po.po_number} is being rejected.`, cta: "Reject" },
    CANCEL: { title: "Cancel purchase order?", text: `${po.po_number} will be cancelled. This cannot be undone.`, cta: "Cancel order" },
  }[dialog || "APPROVE"];

  return (
    <Page>
      <PageHeader
        crumbs={crumbs}
        title={po.po_number || "Purchase order"}
        subtitle={
          <span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Purchase order · {po.agency_name || "No vendor"}
            <StatusPill status={status.toLowerCase()} size="sm" />
          </span>
        }
        actions={
          <>
            {canCancel && (
              <Button variant="ghost" icon={Ban} disabled={busy} onClick={() => setDialog("CANCEL")}>
                Cancel
              </Button>
            )}
            {canReject && (
              <Button variant="ghost" icon={XCircle} disabled={busy} onClick={() => setDialog("REJECT")}>
                Reject
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" iconRight={ChevronDown} disabled={busy}>
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {STATUS_OPTIONS.map((s) => (
                  <DropdownMenuItem key={s} disabled={s === status} onSelect={() => setStatus(s)}>
                    {pretty(s)}
                    {s === status && <Check size={14} className="ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="secondary" icon={Edit3} disabled={busy} onClick={() => nav(`/procurement/purchase-orders/${po.id}/edit`)}>
              Edit
            </Button>
            {canApprove && (
              <Button variant="soft" icon={Check} disabled={busy} onClick={() => setDialog("APPROVE")}>
                Approve
              </Button>
            )}
            <Button
              variant="primary"
              icon={Download}
              loading={downloading}
              onClick={() => download(purchaseOrderFileName(po), { title: `Purchase Order ${po.po_number || ""}`, label: "purchase order" })}
            >
              Download PDF
            </Button>
          </>
        }
      />

      <DocumentPreview>
        <PurchaseOrderDocument ref={docRef} po={po} project={project} />
      </DocumentPreview>

      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{dialogCopy.title}</DialogTitle>
            <DialogDescription>{dialogCopy.text}</DialogDescription>
          </DialogHeader>
          {dialog === "REJECT" && (
            <TextArea
              rows={4}
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection"
              aria-label="Reason for rejection"
            />
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={closeDialog} disabled={busy}>
              Keep as is
            </Button>
            <Button variant={dialog === "APPROVE" ? "primary" : "danger"} onClick={confirmDialog} loading={busy}>
              {dialogCopy.cta}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
}

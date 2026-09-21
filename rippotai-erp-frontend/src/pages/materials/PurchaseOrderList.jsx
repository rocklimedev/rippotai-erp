import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit3,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle2,
  Ban,
  Trash2,
  MoreVertical,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetPurchaseOrdersQuery,
  useApprovePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
} from "../../api/procuerment/purchase-order.api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PurchaseOrderList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [selectedPO, setSelectedPO] = useState(null);

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetPurchaseOrdersQuery();

  const [approvePurchaseOrder, { isLoading: isApproving }] =
    useApprovePurchaseOrderMutation();

  const [cancelPurchaseOrder, { isLoading: isCancelling }] =
    useCancelPurchaseOrderMutation();

  const [deletePurchaseOrder, { isLoading: isDeleting }] =
    useDeletePurchaseOrderMutation();

  // ============================================================
  // FILTER
  // ============================================================

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      const poNumber = String(r.po_number || "").toLowerCase();
      const vendorName = String(r.agency_name || "").toLowerCase();
      const status = String(r.status || "").toLowerCase();

      return (
        poNumber.includes(term) ||
        vendorName.includes(term) ||
        status.includes(term)
      );
    });
  }, [rows, q]);

  // ============================================================
  // HELPERS
  // ============================================================

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

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

  const getUpperStatus = (status) => String(status || "DRAFT").toUpperCase();

  const getStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "APPROVED":
        return "bg-[#E8F4ED] text-[#1F6B45] border-transparent";

      case "DRAFT":
        return "bg-[#F4F6F7] text-[#6B7B7C] border-transparent";

      case "PENDING_APPROVAL":
        return "bg-[#FFF7E6] text-[#9A6B18] border-transparent";

      case "SENT":
        return "bg-[#EEF4F8] text-[#37657D] border-transparent";

      case "PARTIALLY_RECEIVED":
        return "bg-[#FFF7E6] text-[#9A6B18] border-transparent";

      case "RECEIVED":
        return "bg-[#E8F4ED] text-[#1F6B45] border-transparent";

      case "CANCELLED":
        return "bg-[#FDECEC] text-[#A33A3A] border-transparent";

      case "CLOSED":
        return "bg-[#E8EEF0] text-[#425557] border-transparent";

      default:
        return "bg-[#F4F6F7] text-[#6B7B7C] border-transparent";
    }
  };

  const canApprove = (purchaseOrder) => {
    const status = getUpperStatus(purchaseOrder?.status);

    return ![
      "APPROVED",
      "SENT",
      "PARTIALLY_RECEIVED",
      "RECEIVED",
      "CANCELLED",
      "CLOSED",
    ].includes(status);
  };

  const canCancel = (purchaseOrder) => {
    const status = getUpperStatus(purchaseOrder?.status);

    return !["CANCELLED", "RECEIVED", "CLOSED"].includes(status);
  };

  const canDelete = (purchaseOrder) => {
    const status = getUpperStatus(purchaseOrder?.status);

    return status === "DRAFT";
  };

  // ============================================================
  // DELIVERY CHALLAN
  // ============================================================

  const handleCreateDeliveryChallan = (purchaseOrderId) => {
    if (!purchaseOrderId) return;

    nav(
      `/procurement/delivery-challans/new?purchase-order=${encodeURIComponent(
        purchaseOrderId,
      )}`,
    );
  };

  // ============================================================
  // APPROVE
  // ============================================================

  const handleApprove = async (purchaseOrder) => {
    if (!purchaseOrder?.id) return;

    const confirmed = window.confirm(
      `Approve purchase order ${purchaseOrder.po_number || ""}?`,
    );

    if (!confirmed) return;

    try {
      await approvePurchaseOrder(purchaseOrder.id).unwrap();
    } catch (error) {
      console.error("Failed to approve purchase order:", error);

      window.alert(
        error?.data?.message ||
          "Failed to approve purchase order. Please try again.",
      );
    }
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = async (purchaseOrder) => {
    if (!purchaseOrder?.id) return;

    const confirmed = window.confirm(
      `Cancel purchase order ${
        purchaseOrder.po_number || ""
      }?\n\nThis action may not be reversible.`,
    );

    if (!confirmed) return;

    try {
      await cancelPurchaseOrder(purchaseOrder.id).unwrap();
    } catch (error) {
      console.error("Failed to cancel purchase order:", error);

      window.alert(
        error?.data?.message ||
          "Failed to cancel purchase order. Please try again.",
      );
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (purchaseOrder) => {
    if (!purchaseOrder?.id) return;

    const confirmed = window.confirm(
      `Delete purchase order ${
        purchaseOrder.po_number || ""
      }?\n\nThis will permanently remove the purchase order.`,
    );

    if (!confirmed) return;

    try {
      await deletePurchaseOrder(purchaseOrder.id).unwrap();

      if (selectedPO?.id === purchaseOrder.id) {
        setSelectedPO(null);
      }
    } catch (error) {
      console.error("Failed to delete purchase order:", error);

      window.alert(
        error?.data?.message ||
          "Failed to delete purchase order. Please try again.",
      );
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Shell
        title="Purchase Orders"
        subtitle={`${rows.length} purchase order${
          rows.length !== 1 ? "s" : ""
        }`}
        action={
          <Button
            type="button"
            onClick={() => nav("/procurement/purchase-orders/new")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold hover:bg-[#17382F]"
          >
            <Plus size={14} />
            New Purchase Order
          </Button>
        }
      >
        {/* Search */}
        <Input
          placeholder="Search purchase orders…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead className="bg-[#F4F6F7]">
                <tr>
                  <th className="text-left px-3 py-3 whitespace-nowrap">
                    PO Number
                  </th>

                  <th className="text-left px-3 py-3 whitespace-nowrap">
                    Vendor
                  </th>

                  <th className="text-left px-3 py-3 whitespace-nowrap">
                    Order Date
                  </th>

                  <th className="text-left px-3 py-3 whitespace-nowrap">
                    Expected Delivery
                  </th>

                  <th className="text-left px-3 py-3 whitespace-nowrap">
                    Total
                  </th>

                  <th className="text-left px-3 py-3 whitespace-nowrap">
                    Status
                  </th>

                  <th className="text-center px-3 py-3 whitespace-nowrap">
                    Items
                  </th>

                  <th className="text-right px-3 py-3 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {!isLoading &&
                  filteredRows.map((r) => {
                    const items = Array.isArray(r.items) ? r.items : [];
                    const status = getUpperStatus(r.status);

                    return (
                      <tr
                        key={r.id}
                        onClick={() =>
                          nav(`/procurement/purchase-orders/${r.id}`)
                        }
                        className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F8FAF9] cursor-pointer transition-colors"
                      >
                        {/* PO Number */}
                        <td className="px-3 py-2.5 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <ShoppingCart
                              size={14}
                              className="text-[#B5C4B6]"
                            />

                            {r.po_number || "—"}
                          </div>
                        </td>

                        {/* Vendor */}
                        <td className="px-3 py-2.5 text-[#6B7B7C]">
                          {r.agency_name || "—"}
                        </td>

                        {/* PO Date */}
                        <td className="px-3 py-2.5 text-[#6B7B7C]">
                          {formatDate(r.po_date)}
                        </td>

                        {/* Target Delivery */}
                        <td className="px-3 py-2.5 text-[#6B7B7C]">
                          {formatDate(r.target_delivery_date)}
                        </td>

                        {/* Total */}
                        <td className="px-3 py-2.5 font-semibold whitespace-nowrap">
                          {formatCurrency(r.total_amount)}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5">
                          <Badge
                            className={`text-xs font-semibold ${getStatusClass(
                              r.status,
                            )}`}
                          >
                            {r.status || "DRAFT"}
                          </Badge>
                        </td>

                        {/* Items */}
                        <td
                          className="px-3 py-2.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedPO(r)}
                            className="h-8 px-2.5 bg-[#F4F6F7] hover:bg-[#EAEEF0] text-[#1F453B] text-xs font-semibold"
                          >
                            <Package size={14} />
                            {items.length}
                            <span className="hidden lg:inline">Show Items</span>
                          </Button>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-3 py-2.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-[#1F453B] hover:bg-[#EAEEF0]"
                                aria-label="Purchase order actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-60"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* View */}
                              <DropdownMenuItem
                                onSelect={() =>
                                  nav(`/procurement/purchase-orders/${r.id}`)
                                }
                                className="gap-2.5"
                              >
                                <Eye size={15} />
                                <span>View Purchase Order</span>
                              </DropdownMenuItem>

                              {/* Edit */}
                              <DropdownMenuItem
                                onSelect={() =>
                                  nav(
                                    `/procurement/purchase-orders/${r.id}/edit`,
                                  )
                                }
                                className="gap-2.5"
                              >
                                <Edit3 size={15} />
                                <span>Edit Purchase Order</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Delivery Challan */}
                              <DropdownMenuItem
                                disabled={
                                  status === "CANCELLED" || status === "CLOSED"
                                }
                                onSelect={() =>
                                  handleCreateDeliveryChallan(r.id)
                                }
                                className="gap-2.5 text-[#1F453B]"
                              >
                                <Truck size={15} />
                                <span>Create Delivery Challan</span>
                              </DropdownMenuItem>

                              {/* Approve */}
                              <DropdownMenuItem
                                disabled={!canApprove(r) || isApproving}
                                onSelect={() => handleApprove(r)}
                                className="gap-2.5 text-[#1F6B45]"
                              >
                                <CheckCircle2 size={15} />

                                <span>
                                  {isApproving
                                    ? "Approving..."
                                    : "Approve Purchase Order"}
                                </span>
                              </DropdownMenuItem>

                              {/* Cancel */}
                              <DropdownMenuItem
                                disabled={!canCancel(r) || isCancelling}
                                onSelect={() => handleCancel(r)}
                                className="gap-2.5 text-[#9A6B18]"
                              >
                                <Ban size={15} />

                                <span>
                                  {isCancelling
                                    ? "Cancelling..."
                                    : "Cancel Purchase Order"}
                                </span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Delete */}
                              <DropdownMenuItem
                                disabled={!canDelete(r) || isDeleting}
                                onSelect={() => handleDelete(r)}
                                className="gap-2.5 text-[#A33A3A] focus:text-[#A33A3A] focus:bg-[#FDECEC]"
                              >
                                <Trash2 size={15} />

                                <span>
                                  {isDeleting
                                    ? "Deleting..."
                                    : "Delete Purchase Order"}
                                </span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}

                {/* Loading */}
                {isFetching && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#B5C4B6] py-8">
                      Loading purchase orders...
                    </td>
                  </tr>
                )}

                {/* Empty */}
                {!isFetching && !filteredRows.length && (
                  <tr>
                    <td colSpan={8} className="text-center text-[#B5C4B6] py-8">
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </Shell>

      {/* ============================================================
          ITEMS DIALOG - SHADCN
      ============================================================ */}

      <Dialog
        open={Boolean(selectedPO)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPO(null);
          }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-6xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          {selectedPO && (
            <>
              {/* Dialog Header */}
              <DialogHeader className="px-5 py-4 border-b border-[#E5EAEA]">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-[#EEF4F1] flex items-center justify-center shrink-0">
                    <ShoppingCart size={17} className="text-[#1F453B]" />
                  </div>

                  <div className="text-left">
                    <DialogTitle className="text-[17px] font-semibold text-[#1F453B]">
                      Purchase Order Items
                    </DialogTitle>

                    <DialogDescription className="text-xs text-[#7A898A] mt-0.5">
                      {selectedPO.po_number || "—"} ·{" "}
                      {selectedPO.agency_name || "No vendor"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* PO Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-5 py-4 bg-[#FAFBFB] border-b border-[#E5EAEA]">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-[#8A9697]">
                    PO Number
                  </div>

                  <div className="mt-1 text-sm font-semibold text-[#1F453B]">
                    {selectedPO.po_number || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wide text-[#8A9697]">
                    Vendor
                  </div>

                  <div className="mt-1 text-sm font-semibold text-[#1F453B]">
                    {selectedPO.agency_name || "—"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wide text-[#8A9697]">
                    Order Date
                  </div>

                  <div className="mt-1 text-sm font-semibold text-[#1F453B]">
                    {formatDate(selectedPO.po_date)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-wide text-[#8A9697]">
                    Total
                  </div>

                  <div className="mt-1 text-sm font-semibold text-[#1F453B]">
                    {formatCurrency(selectedPO.total_amount)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 min-h-0 overflow-auto">
                {Array.isArray(selectedPO.items) &&
                selectedPO.items.length > 0 ? (
                  <table className="w-full text-[13px] min-w-[1100px]">
                    <thead className="sticky top-0 bg-[#F4F6F7] z-10">
                      <tr>
                        <th className="text-left px-4 py-3">#</th>

                        <th className="text-left px-4 py-3">Material</th>

                        <th className="text-left px-4 py-3">Description</th>

                        <th className="text-left px-4 py-3">Specification</th>

                        <th className="text-left px-4 py-3">Brand</th>

                        <th className="text-left px-4 py-3">Unit</th>

                        <th className="text-right px-4 py-3">Qty</th>

                        <th className="text-right px-4 py-3">Rate</th>

                        <th className="text-right px-4 py-3">Amount</th>

                        <th className="text-right px-4 py-3">Received</th>

                        <th className="text-right px-4 py-3">Pending</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedPO.items
                        .slice()
                        .sort(
                          (a, b) =>
                            Number(a.line_number || 0) -
                            Number(b.line_number || 0),
                        )
                        .map((item, index) => {
                          const material = item.material || {};

                          return (
                            <tr
                              key={item.id || index}
                              className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#FAFBFB]"
                            >
                              {/* Line */}
                              <td className="px-4 py-3 text-[#7A898A]">
                                {item.line_number || index + 1}
                              </td>

                              {/* Material */}
                              <td className="px-4 py-3">
                                <div className="font-semibold text-[#1F453B]">
                                  {material.name || item.description || "—"}
                                </div>

                                {material.material_code && (
                                  <div className="text-[11px] text-[#8A9697] mt-0.5">
                                    {material.material_code}
                                  </div>
                                )}
                              </td>

                              {/* Description */}
                              <td className="px-4 py-3 text-[#6B7B7C] max-w-[220px]">
                                {item.description || "—"}
                              </td>

                              {/* Specification */}
                              <td className="px-4 py-3 text-[#6B7B7C] max-w-[250px]">
                                {item.specification ||
                                  material.specification ||
                                  "—"}
                              </td>

                              {/* Brand */}
                              <td className="px-4 py-3 text-[#6B7B7C]">
                                {item.brand || material.brand || "—"}
                              </td>

                              {/* Unit */}
                              <td className="px-4 py-3 text-[#6B7B7C]">
                                {item.unit || "—"}
                              </td>

                              {/* Quantity */}
                              <td className="px-4 py-3 text-right font-semibold">
                                {Number(
                                  item.ordered_quantity || 0,
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 3,
                                })}
                              </td>

                              {/* Rate */}
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(item.rate)}
                              </td>

                              {/* Amount */}
                              <td className="px-4 py-3 text-right font-semibold">
                                {formatCurrency(item.amount)}
                              </td>

                              {/* Received */}
                              <td className="px-4 py-3 text-right text-[#1F6B45] font-medium">
                                {Number(
                                  item.received_quantity || 0,
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 3,
                                })}
                              </td>

                              {/* Pending */}
                              <td className="px-4 py-3 text-right text-[#9A6B18] font-medium">
                                {Number(
                                  item.pending_quantity || 0,
                                ).toLocaleString("en-IN", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 3,
                                })}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-14 text-center">
                    <Package size={32} className="mx-auto text-[#B5C4B6]" />

                    <p className="mt-3 text-sm font-semibold text-[#1F453B]">
                      No items found
                    </p>

                    <p className="mt-1 text-xs text-[#8A9697]">
                      This purchase order does not contain any items.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <DialogFooter className="flex items-center justify-between px-5 py-3 border-t border-[#E5EAEA] bg-[#FAFBFB] sm:justify-between">
                <div className="text-xs text-[#7A898A]">
                  {Array.isArray(selectedPO.items)
                    ? `${selectedPO.items.length} item${
                        selectedPO.items.length !== 1 ? "s" : ""
                      }`
                    : "0 items"}
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-[#7A898A]">PO Total</div>

                  <div className="text-sm font-bold text-[#1F453B]">
                    {formatCurrency(selectedPO.total_amount)}
                  </div>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

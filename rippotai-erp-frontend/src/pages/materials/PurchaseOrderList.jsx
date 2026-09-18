import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit3,
  ShoppingCart,
  Package,
  Truck,
  X,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetPurchaseOrdersQuery } from "../../api/procuerment/purchase-order.api";

export default function PurchaseOrderList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [selectedPO, setSelectedPO] = useState(null);

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetPurchaseOrdersQuery();

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

  const getStatusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
      case "APPROVED":
        return "bg-[#E8F4ED] text-[#1F6B45]";

      case "DRAFT":
        return "bg-[#F4F6F7] text-[#6B7B7C]";

      case "SENT":
        return "bg-[#EEF4F8] text-[#37657D]";

      case "PARTIALLY_RECEIVED":
        return "bg-[#FFF7E6] text-[#9A6B18]";

      case "RECEIVED":
        return "bg-[#E8F4ED] text-[#1F6B45]";

      case "CANCELLED":
        return "bg-[#FDECEC] text-[#A33A3A]";

      default:
        return "bg-[#F4F6F7] text-[#6B7B7C]";
    }
  };

  const handleCreateDeliveryChallan = (e, purchaseOrderId) => {
    e.stopPropagation();

    if (!purchaseOrderId) return;

    nav(
      `/procurement/delivery-challans/new?purchase-order=${encodeURIComponent(
        purchaseOrderId,
      )}`,
    );
  };

  return (
    <>
      <Shell
        title="Purchase Orders"
        subtitle={`${rows.length} purchase order${
          rows.length !== 1 ? "s" : ""
        }`}
        action={
          <button
            onClick={() => nav("/procurement/purchase-orders/new")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F] transition-colors"
          >
            <Plus size={14} />
            New Purchase Order
          </button>
        }
      >
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
                          <span
                            className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold ${getStatusClass(
                              r.status,
                            )}`}
                          >
                            {r.status || "DRAFT"}
                          </span>
                        </td>

                        {/* Items */}
                        <td
                          className="px-3 py-2.5 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedPO(r)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F4F6F7] hover:bg-[#EAEEF0] text-[#1F453B] text-xs font-semibold transition-colors"
                            title="Show purchase order items"
                          >
                            <Package size={14} />

                            {items.length}

                            <span className="hidden lg:inline">Show Items</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td
                          className="px-3 py-2.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            {/* Create Delivery Challan */}
                            <button
                              type="button"
                              onClick={(e) =>
                                handleCreateDeliveryChallan(e, r.id)
                              }
                              className="p-1.5 rounded hover:bg-[#E8F4ED] text-[#1F453B] transition-colors"
                              title="Create delivery challan"
                              aria-label="Create delivery challan"
                            >
                              <Truck size={15} />
                            </button>

                            {/* View Purchase Order */}
                            <button
                              type="button"
                              onClick={() =>
                                nav(`/procurement/purchase-orders/${r.id}`)
                              }
                              className="p-1.5 rounded hover:bg-[#EAEEF0] transition-colors"
                              title="View purchase order"
                              aria-label="View purchase order"
                            >
                              <Eye size={15} />
                            </button>

                            {/* Edit Purchase Order */}
                            <button
                              type="button"
                              onClick={() =>
                                nav(`/procurement/purchase-orders/${r.id}/edit`)
                              }
                              className="p-1.5 rounded hover:bg-[#EAEEF0] transition-colors"
                              title="Edit purchase order"
                              aria-label="Edit purchase order"
                            >
                              <Edit3 size={15} />
                            </button>
                          </div>
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

      {/* =========================
          ITEMS MODAL
      ========================= */}
      {selectedPO && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedPO(null);
            }
          }}
        >
          <div className="w-full max-w-6xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5EAEA]">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-[#EEF4F1] flex items-center justify-center">
                  <ShoppingCart size={17} className="text-[#1F453B]" />
                </div>

                <div>
                  <h2 className="text-[17px] font-semibold text-[#1F453B]">
                    Purchase Order Items
                  </h2>

                  <p className="text-xs text-[#7A898A] mt-0.5">
                    {selectedPO.po_number || "—"} ·{" "}
                    {selectedPO.agency_name || "No vendor"}
                  </p>
                </div>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={() => setSelectedPO(null)}
                className="p-2 rounded-lg hover:bg-[#F4F6F7] text-[#6B7B7C] transition-colors"
                title="Close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

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

            {/* Items Content */}
            <div className="flex-1 overflow-auto">
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

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5EAEA] bg-[#FAFBFB]">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}

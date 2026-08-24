import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, ShoppingCart } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetPurchaseOrdersQuery } from "../../api/procurent.api";

export default function PurchaseOrderList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetPurchaseOrdersQuery();

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      return (
        (r.poNumber || r.po_number || "").toLowerCase().includes(term) ||
        (r.vendorName || r.vendor_name || "").toLowerCase().includes(term) ||
        (r.status || "").toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  return (
    <Shell
      title="Purchase Orders"
      subtitle={`${rows.length} purchase order${rows.length !== 1 ? "s" : ""}`}
      action={
        <button
          onClick={() => nav("/materials/purchase-orders/new")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
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
                <th className="text-left px-3 py-3">PO Number</th>
                <th className="text-left px-3 py-3">Vendor</th>
                <th className="text-left px-3 py-3">Order Date</th>
                <th className="text-left px-3 py-3">Expected Delivery</th>
                <th className="text-left px-3 py-3">Total</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/materials/purchase-orders/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <ShoppingCart size={14} className="text-[#B5C4B6]" />
                        {r.poNumber || r.po_number || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.vendorName || r.vendor_name || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.orderDate || r.order_date || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.expectedDeliveryDate ||
                        r.expected_delivery_date ||
                        "—"}
                    </td>

                    <td className="px-3 py-2.5 font-semibold">
                      ₹{Number(r.totalAmount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-xs font-semibold">
                        {r.status || "OPEN"}
                      </span>
                    </td>

                    <td
                      className="px-3 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          nav(`/materials/purchase-orders/${r.id}`)
                        }
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() =>
                          nav(`/materials/purchase-orders/${r.id}/edit`)
                        }
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

              {isFetching && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    Loading purchase orders...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}

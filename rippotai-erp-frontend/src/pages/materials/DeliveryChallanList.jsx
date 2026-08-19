import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, Truck } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetDeliveryChallansForPurchaseOrderQuery } from "../../api/procurent.api";

export default function DeliveryChallanList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const purchaseOrderId =
    new URLSearchParams(window.location.search).get("purchase_order_id") || "";

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetDeliveryChallansForPurchaseOrderQuery(purchaseOrderId, {
    skip: !purchaseOrderId,
  });

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      return (
        (r.challanNumber || r.challan_number || "")
          .toLowerCase()
          .includes(term) ||
        (r.siteStage || r.site_stage || "").toLowerCase().includes(term) ||
        (r.receivedBy || r.received_by || "").toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  return (
    <Shell
      title="Delivery Challans"
      subtitle={`${rows.length} delivery challan${
        rows.length !== 1 ? "s" : ""
      }`}
      action={
        <button
          onClick={() =>
            nav(
              purchaseOrderId
                ? `/materials/delivery-challans/new?purchase_order_id=${purchaseOrderId}`
                : "/materials/delivery-challans/new",
            )
          }
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Delivery Challan
        </button>
      }
    >
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search delivery challans…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {!purchaseOrderId && (
          <span className="text-[13px] text-[#B05A3C]">
            Select a purchase order to view its delivery challans.
          </span>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Challan Number</th>
                <th className="text-left px-3 py-3">Delivery Date</th>
                <th className="text-left px-3 py-3">Site Stage</th>
                <th className="text-left px-3 py-3">Received By</th>
                <th className="text-left px-3 py-3">Items</th>
                <th className="text-left px-3 py-3">Notes</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/materials/delivery-challans/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Truck size={14} className="text-[#B5C4B6]" />
                        {r.challanNumber || r.challan_number || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.deliveryDate || r.delivery_date || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.siteStage || r.site_stage || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.receivedBy || r.received_by || "—"}
                    </td>

                    <td className="px-3 py-2.5">{r.items?.length ?? 0}</td>

                    <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[250px]">
                      <span className="truncate block">{r.notes || "—"}</span>
                    </td>

                    <td
                      className="px-3 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          nav(`/materials/delivery-challans/${r.id}`)
                        }
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() =>
                          nav(`/materials/delivery-challans/${r.id}/edit`)
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
                    Loading delivery challans...
                  </td>
                </tr>
              )}

              {!isFetching && purchaseOrderId && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    No delivery challans found.
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

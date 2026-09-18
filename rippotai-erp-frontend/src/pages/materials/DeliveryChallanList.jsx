import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Edit3,
  Truck,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  ClipboardCheck,
} from "lucide-react";

import { Shell } from "../../hooks/shared";

import { useGetDeliveryChallansQuery } from "../../api/procuerment/delivery-challan.api";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DeliveryChallanList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  // Used only to pre-fill the New Delivery Challan form.
  // The list itself always loads ALL delivery challans.
  const purchaseOrderId =
    new URLSearchParams(window.location.search).get("purchase_order_id") || "";

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetDeliveryChallansQuery();

  /**
   * API response is currently:
   *
   * [
   *   {
   *     id,
   *     challan_number,
   *     project_id,
   *     site_id,
   *     purchase_order_id,
   *     vendor_id,
   *     challan_date,
   *     site_address,
   *     status,
   *     gate_pass_received,
   *     material_checked,
   *     general_remarks,
   *     discrepancy_notes,
   *     dispatched_by,
   *     dispatched_at,
   *     received_by,
   *     received_at,
   *     attachment_url,
   *     created_by,
   *     items: [...]
   *   }
   * ]
   *
   * Handle both a direct array and an API response wrapper.
   */
  const rows = useMemo(() => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.rows)) {
      return response.rows;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    return [];
  }, [response]);

  /**
   * Search across the actual fields returned by the API.
   */
  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((r) => {
      const searchableValues = [
        r.challan_number,
        r.challan_date,
        r.purchase_order_id,
        r.project_id,
        r.site_id,
        r.vendor_id,
        r.site_address,
        r.status,
        r.general_remarks,
        r.discrepancy_notes,
        r.dispatched_by,
        r.received_by,

        // Search item information as well.
        ...(r.items || []).flatMap((item) => [
          item.description,
          item.brand,
          item.specification,
          item.condition_status,
          item.condition_notes,
          item.stored_at,
          item.remarks,
          item.material?.material_code,
          item.material?.name,
          item.material?.category,
          item.material?.sub_category,
          item.material?.brand,
          item.material?.specification,
        ]),
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [rows, q]);

  /**
   * Status configuration.
   */
  const getStatusConfig = (status) => {
    switch (status) {
      case "ACCEPTED":
        return {
          label: "Accepted",
          icon: CheckCircle2,
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        };

      case "PARTIALLY_ACCEPTED":
        return {
          label: "Partially Accepted",
          icon: AlertCircle,
          className: "border-amber-200 bg-amber-50 text-amber-700",
        };

      case "REJECTED":
        return {
          label: "Rejected",
          icon: XCircle,
          className: "border-red-200 bg-red-50 text-red-700",
        };

      case "PENDING":
        return {
          label: "Pending",
          icon: Clock,
          className: "border-slate-200 bg-slate-50 text-slate-700",
        };

      default:
        return {
          label: String(status || "Unknown")
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()),
          icon: ClipboardCheck,
          className: "border-slate-200 bg-slate-50 text-slate-700",
        };
    }
  };

  /**
   * Format date without timezone shifting.
   *
   * API returns:
   * 2026-09-16
   */
  const formatDate = (value) => {
    if (!value) return "—";

    const dateString = String(value).slice(0, 10);

    const parts = dateString.split("-");

    if (parts.length !== 3) {
      return value;
    }

    const [year, month, day] = parts;

    return `${day}/${month}/${year}`;
  };

  /**
   * Calculate item summary.
   */
  const getItemSummary = (items = []) => {
    const total = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const accepted = items.reduce(
      (sum, item) => sum + Number(item.accepted_quantity || 0),
      0,
    );

    const shortage = items.reduce(
      (sum, item) => sum + Number(item.shortage_quantity || 0),
      0,
    );

    const damaged = items.reduce(
      (sum, item) => sum + Number(item.damaged_quantity || 0),
      0,
    );

    const rejected = items.reduce(
      (sum, item) => sum + Number(item.rejected_quantity || 0),
      0,
    );

    return {
      count: items.length,
      total,
      accepted,
      shortage,
      damaged,
      rejected,
    };
  };

  return (
    <Shell
      title="Delivery Challans"
      subtitle={`${rows.length} delivery challan${
        rows.length !== 1 ? "s" : ""
      }`}
      action={
        <Button
          onClick={() =>
            nav(
              purchaseOrderId
                ? `/procurement/delivery-challans/new?purchase_order_id=${purchaseOrderId}`
                : "/procurement/delivery-challans/new",
            )
          }
          className="h-10 bg-[#1F453B] hover:bg-[#16372F]"
        >
          <Plus size={16} />
          New Delivery Challan
        </Button>
      }
    >
      {/* ============================================================
          SEARCH / FILTER BAR
      ============================================================ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <Input
            placeholder="Search challan, PO, vendor, material..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isFetching && !isLoading && <span>Refreshing...</span>}

          {!isLoading && (
            <span>
              Showing {filteredRows.length} of {rows.length}
            </span>
          )}
        </div>
      </div>

      {/* ============================================================
          ERROR
      ============================================================ */}
      {isError && (
        <Card className="border-red-200">
          <CardContent className="py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <XCircle size={28} className="text-red-500" />

              <p className="font-medium text-red-700">
                Failed to load delivery challans
              </p>

              {error?.data?.message && (
                <p className="text-sm text-muted-foreground">
                  {error.data.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================
          TABLE
      ============================================================ */}
      {!isError && (
        <Card className="border-[#1F453B]/10 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-[#F4F6F7]">
                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Challan
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Date
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Purchase Order
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Vendor
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Items
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Acceptance
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Status
                    </th>

                    <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">
                      Checks
                    </th>

                    <th className="text-right px-4 py-3 font-semibold whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* Loading */}
                  {isLoading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Truck
                            size={28}
                            className="animate-pulse text-[#B5C4B6]"
                          />

                          <span>Loading delivery challans...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Rows */}
                  {!isLoading &&
                    filteredRows.map((r) => {
                      const summary = getItemSummary(r.items);

                      const statusConfig = getStatusConfig(r.status);

                      const StatusIcon = statusConfig.icon;

                      return (
                        <tr
                          key={r.id}
                          onClick={() =>
                            nav(`/procurement/delivery-challans/${r.id}`)
                          }
                          className="border-b last:border-b-0 hover:bg-[#F8FAF9] cursor-pointer transition-colors"
                        >
                          {/* CHALLAN */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8EFEB]">
                                <Truck size={15} className="text-[#1F453B]" />
                              </div>

                              <div>
                                <div className="font-semibold text-[#1F453B]">
                                  {r.challan_number || "—"}
                                </div>

                                <div className="text-[11px] text-muted-foreground font-mono">
                                  {r.id?.slice(0, 8)}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* DATE */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-muted-foreground">
                              {formatDate(r.challan_date)}
                            </span>
                          </td>

                          {/* PO */}
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {r.purchase_order_id ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();

                                    nav(
                                      `/procurement/purchase-orders/${r.purchase_order_id}`,
                                    );
                                  }}
                                  className="text-[#1F453B] hover:underline font-mono text-xs"
                                >
                                  {r.purchase_order_id.slice(0, 8)}
                                  ...
                                </button>
                              ) : (
                                "—"
                              )}
                            </div>
                          </td>

                          {/* VENDOR */}
                          <td className="px-4 py-3">
                            {r.vendor_id ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                {r.vendor_id.slice(0, 8)}
                                ...
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* ITEMS */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Package size={15} className="text-[#6B7B7C]" />

                              <div>
                                <div className="font-medium">
                                  {summary.count}{" "}
                                  {summary.count === 1 ? "item" : "items"}
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  Qty: {summary.total}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ACCEPTANCE */}
                          <td className="px-4 py-3">
                            <div className="space-y-1 min-w-[130px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Accepted
                                </span>

                                <span className="font-medium text-emerald-700">
                                  {summary.accepted}
                                </span>
                              </div>

                              {summary.shortage > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Shortage
                                  </span>

                                  <span className="font-medium text-amber-700">
                                    {summary.shortage}
                                  </span>
                                </div>
                              )}

                              {summary.damaged > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Damaged
                                  </span>

                                  <span className="font-medium text-red-700">
                                    {summary.damaged}
                                  </span>
                                </div>
                              )}

                              {summary.rejected > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Rejected
                                  </span>

                                  <span className="font-medium text-red-700">
                                    {summary.rejected}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={`gap-1.5 whitespace-nowrap ${statusConfig.className}`}
                            >
                              <StatusIcon size={13} />

                              {statusConfig.label}
                            </Badge>
                          </td>

                          {/* CHECKS */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <div
                                className={`text-xs flex items-center gap-1.5 ${
                                  r.gate_pass_received
                                    ? "text-emerald-700"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {r.gate_pass_received ? (
                                  <CheckCircle2 size={13} />
                                ) : (
                                  <Clock size={13} />
                                )}
                                Gate Pass
                              </div>

                              <div
                                className={`text-xs flex items-center gap-1.5 ${
                                  r.material_checked
                                    ? "text-emerald-700"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {r.material_checked ? (
                                  <CheckCircle2 size={13} />
                                ) : (
                                  <Clock size={13} />
                                )}
                                Material Checked
                              </div>
                            </div>
                          </td>

                          {/* ACTIONS */}
                          <td
                            className="px-4 py-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  nav(`/procurement/delivery-challans/${r.id}`)
                                }
                                title="View"
                              >
                                <Eye size={16} />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  nav(
                                    `/procurement/delivery-challans/${r.id}/edit`,
                                  )
                                }
                                title="Edit"
                              >
                                <Edit3 size={16} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {/* Empty */}
                  {!isLoading && !filteredRows.length && (
                    <tr>
                      <td colSpan={9} className="py-14 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-[#E8EFEB] flex items-center justify-center">
                            <Truck size={22} className="text-[#1F453B]" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {q.trim()
                                ? "No delivery challans found"
                                : "No delivery challans yet"}
                            </p>

                            <p className="text-sm text-muted-foreground mt-1">
                              {q.trim()
                                ? "Try changing your search."
                                : "Create your first delivery challan to get started."}
                            </p>
                          </div>

                          {!q.trim() && (
                            <Button
                              onClick={() =>
                                nav(
                                  purchaseOrderId
                                    ? `/procurement/delivery-challans/new?purchase_order_id=${purchaseOrderId}`
                                    : "/procurement/delivery-challans/new",
                                )
                              }
                              className="mt-1 bg-[#1F453B] hover:bg-[#16372F]"
                            >
                              <Plus size={16} />
                              New Delivery Challan
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </Shell>
  );
}

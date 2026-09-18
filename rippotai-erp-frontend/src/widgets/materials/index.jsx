import React from "react";
import { useNavigate } from "react-router-dom";
import { WidgetShell, Stat, RowList, useEndpoint } from "../common/hooks";

/* -------- Phase G: Materials widgets --------
 * Mirrors the shape of ./boqs, ./vendors, ./quots, ./calendar:
 * small dashboard-grid widgets backed by useEndpoint("/materials/dashboard").
 *
 * Expected shape of GET /materials/dashboard (adjust to match the real API):
 * {
 *   stats: {
 *     total_materials, total_stock_units, stock_value,
 *     low_stock, out_of_stock,
 *     pending_requests, approved_requests,
 *     active_purchase_orders, pending_deliveries,
 *     inward_today, outward_today, pending_grn
 *   },
 *   categories: [{ id, name, items, stock, value, low_stock }],
 *   low_stock_items: [{ id, name, category, current, minimum, unit, warehouse }],
 *   requests: [{ id, project_name, requested_by, items, priority, status, date }],
 *   purchase_orders: [{ id, vendor, project_name, amount, items, status, expected_date }],
 *   movements: [{ id, type, material, quantity, unit, location, reference, time }],
 *   activity: [{ id, type, title, description, time }],
 * }
 */

const formatCurrency = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: value >= 100000 ? "compact" : "standard",
  }).format(value);
};

const formatNumber = (value) => {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN").format(value);
};

/* ============================================================
   STAT WIDGETS
============================================================ */

export const MatTotalMaterials = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell
      title="Total Materials"
      onClick={() => nav("/materials/inventory")}
    >
      <Stat
        value={formatNumber(d?.stats?.total_materials)}
        sub={
          d?.stats?.total_stock_units != null
            ? `${formatNumber(d.stats.total_stock_units)} units in stock`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const MatStockValue = () => {
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell title="Stock Value">
      <Stat
        value={formatCurrency(d?.stats?.stock_value)}
        sub="current inventory valuation"
      />
    </WidgetShell>
  );
};

export const MatLowStock = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell
      title="Low Stock"
      onClick={() => nav("/materials/inventory?filter=low-stock")}
    >
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-[36px] font-bold text-[#B04D26] leading-none">
          {d?.stats?.low_stock ?? "—"}
        </div>
        <div className="text-[11px] text-[#6B7B7C] mt-1">
          {d?.stats?.out_of_stock != null
            ? `${d.stats.out_of_stock} out of stock`
            : "materials below minimum"}
        </div>
      </div>
    </WidgetShell>
  );
};

export const MatOutOfStock = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell
      title="Out of Stock"
      onClick={() => nav("/materials/inventory?filter=out-of-stock")}
    >
      <Stat value={d?.stats?.out_of_stock ?? "—"} sub="materials unavailable" />
    </WidgetShell>
  );
};

export const MatPendingRequests = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell
      title="Pending Requests"
      onClick={() => nav("/materials/requests")}
    >
      <Stat
        value={d?.stats?.pending_requests ?? "—"}
        sub={
          d?.stats?.approved_requests != null
            ? `${d.stats.approved_requests} already approved`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const MatActivePurchaseOrders = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell
      title="Active Purchase Orders"
      onClick={() => nav("/materials/purchase-orders")}
    >
      <Stat
        value={d?.stats?.active_purchase_orders ?? "—"}
        sub={
          d?.stats?.pending_deliveries != null
            ? `${d.stats.pending_deliveries} deliveries pending`
            : undefined
        }
      />
    </WidgetShell>
  );
};

export const MatPendingGRN = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell title="Pending GRN" onClick={() => nav("/materials/grn")}>
      <Stat
        value={d?.stats?.pending_grn ?? "—"}
        sub="receipts awaiting verification"
      />
    </WidgetShell>
  );
};

export const MatInwardToday = () => {
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell title="Inward Today">
      <Stat
        value={
          d?.stats?.inward_today != null
            ? `${formatNumber(d.stats.inward_today)}`
            : "—"
        }
        sub="units received today"
      />
    </WidgetShell>
  );
};

export const MatOutwardToday = () => {
  const d = useEndpoint("/materials/dashboard");
  return (
    <WidgetShell title="Outward Today">
      <Stat
        value={
          d?.stats?.outward_today != null
            ? `${formatNumber(d.stats.outward_today)}`
            : "—"
        }
        sub="units issued today"
      />
    </WidgetShell>
  );
};

/* ============================================================
   LIST / ROW WIDGETS
============================================================ */

export const MatLowStockList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  const rows = (d?.low_stock_items || []).slice(0, 6).map((item) => ({
    id: item.id,
    title: item.name,
    subtitle: `${item.category} · ${item.warehouse || "—"}`,
    right: `${item.current}/${item.minimum} ${item.unit || ""}`.trim(),
  }));
  return (
    <WidgetShell title="Low Stock Alerts">
      <RowList
        rows={rows}
        onClick={() => nav("/materials/inventory?filter=low-stock")}
        empty="No materials below minimum stock"
      />
    </WidgetShell>
  );
};

export const MatRequestsList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  const rows = (d?.requests || []).slice(0, 6).map((r) => ({
    id: r.id,
    title: r.id,
    subtitle: `${r.project_name || "General"} · ${r.items} items`,
    right: r.status,
  }));
  return (
    <WidgetShell title="Material Requests">
      <RowList
        rows={rows}
        onClick={() => nav("/materials/requests")}
        empty="No material requests yet"
      />
    </WidgetShell>
  );
};

export const MatPurchaseOrdersList = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  const rows = (d?.purchase_orders || []).slice(0, 6).map((po) => ({
    id: po.id,
    title: po.id,
    subtitle: `${po.vendor} · ${po.project_name || "General"}`,
    right: formatCurrency(po.amount),
  }));
  return (
    <WidgetShell title="Purchase Orders">
      <RowList
        rows={rows}
        onClick={() => nav("/materials/purchase-orders")}
        empty="No purchase orders yet"
      />
    </WidgetShell>
  );
};

export const MatRecentMovements = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  const rows = (d?.movements || []).slice(0, 6).map((m) => ({
    id: m.id,
    title: m.material,
    subtitle: `${m.type === "INWARD" ? "IN" : "OUT"} · ${m.location || "—"}`,
    right: `${m.quantity} ${m.unit || ""}`.trim(),
  }));
  return (
    <WidgetShell title="Recent Material Movement">
      <RowList
        rows={rows}
        onClick={() => nav("/materials/movements")}
        empty="No movements recorded today"
      />
    </WidgetShell>
  );
};

export const MatCategoryWise = () => {
  const nav = useNavigate();
  const d = useEndpoint("/materials/dashboard");
  const rows = (d?.categories || []).slice(0, 6).map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: `${formatNumber(c.items)} items · ${formatNumber(c.stock)} units`,
    right: formatCurrency(c.value),
  }));
  return (
    <WidgetShell title="Inventory by Category">
      <RowList
        rows={rows}
        onClick={() => nav("/materials/inventory")}
        empty="No category data yet"
      />
    </WidgetShell>
  );
};

export const MatRecentActivity = () => {
  const d = useEndpoint("/materials/dashboard");
  const rows = (d?.activity || []).slice(0, 6).map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.description,
    right: a.time,
  }));
  return (
    <WidgetShell title="Recent Activity">
      <RowList rows={rows} empty="No recent material activity" />
    </WidgetShell>
  );
};

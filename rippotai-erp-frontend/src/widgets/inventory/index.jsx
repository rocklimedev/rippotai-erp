import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { relativeTime } from "@/lib/format";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

import {
  WidgetShell,
  Stat,
  RowList,
  CHART,
  HeroAreaChart,
  DonutMix,
  IconListWidget,
} from "../common/hooks";

/* ============================================================
   MOCK INVENTORY DATA
============================================================ */

const MOCK_INVENTORY = [
  {
    id: "INV-001",
    material_name: "Plywood 18mm",
    category: "Carpentry",
    site_id: "SITE-001",
    site_name: "DLF Phase 1",
    quantity: 145,
    unit: "Sheets",
    minimum_stock: 50,
    status: "AVAILABLE",
    createdAt: "2026-09-20T10:30:00",
  },
  {
    id: "INV-002",
    material_name: "MDF Board 12mm",
    category: "Carpentry",
    site_id: "SITE-001",
    site_name: "DLF Phase 1",
    quantity: 72,
    unit: "Sheets",
    minimum_stock: 30,
    status: "AVAILABLE",
    createdAt: "2026-09-19T12:20:00",
  },
  {
    id: "INV-003",
    material_name: "Wall Paint - White",
    category: "Painting",
    site_id: "SITE-002",
    site_name: "Golf Course Road",
    quantity: 28,
    unit: "Ltr",
    minimum_stock: 40,
    status: "LOW_STOCK",
    createdAt: "2026-09-18T09:15:00",
  },
  {
    id: "INV-004",
    material_name: "Wall Paint - Grey",
    category: "Painting",
    site_id: "SITE-002",
    site_name: "Golf Course Road",
    quantity: 65,
    unit: "Ltr",
    minimum_stock: 30,
    status: "AVAILABLE",
    createdAt: "2026-09-17T14:10:00",
  },
  {
    id: "INV-005",
    material_name: "Electrical Wire 2.5mm",
    category: "Electrical",
    site_id: "SITE-003",
    site_name: "Sohna Road",
    quantity: 850,
    unit: "Mtr",
    minimum_stock: 500,
    status: "AVAILABLE",
    createdAt: "2026-09-16T11:40:00",
  },
  {
    id: "INV-006",
    material_name: "Electrical Wire 1.5mm",
    category: "Electrical",
    site_id: "SITE-003",
    site_name: "Sohna Road",
    quantity: 320,
    unit: "Mtr",
    minimum_stock: 400,
    status: "LOW_STOCK",
    createdAt: "2026-09-15T16:20:00",
  },
  {
    id: "INV-007",
    material_name: "Floor Tile 600x600",
    category: "Flooring",
    site_id: "SITE-004",
    site_name: "Sector 57",
    quantity: 480,
    unit: "Sqft",
    minimum_stock: 200,
    status: "AVAILABLE",
    createdAt: "2026-09-14T10:15:00",
  },
  {
    id: "INV-008",
    material_name: "Wall Tile 300x600",
    category: "Flooring",
    site_id: "SITE-004",
    site_name: "Sector 57",
    quantity: 165,
    unit: "Sqft",
    minimum_stock: 250,
    status: "LOW_STOCK",
    createdAt: "2026-09-13T13:30:00",
  },
  {
    id: "INV-009",
    material_name: "Cement OPC 43",
    category: "Civil",
    site_id: "SITE-005",
    site_name: "MG Road",
    quantity: 120,
    unit: "Bags",
    minimum_stock: 50,
    status: "AVAILABLE",
    createdAt: "2026-09-12T09:00:00",
  },
  {
    id: "INV-010",
    material_name: "Gypsum Board",
    category: "Civil",
    site_id: "SITE-005",
    site_name: "MG Road",
    quantity: 45,
    unit: "Sheets",
    minimum_stock: 60,
    status: "LOW_STOCK",
    createdAt: "2026-09-11T15:45:00",
  },
  {
    id: "INV-011",
    material_name: "PVC Pipe 25mm",
    category: "Plumbing",
    site_id: "SITE-006",
    site_name: "Vasant Kunj",
    quantity: 210,
    unit: "Mtr",
    minimum_stock: 100,
    status: "AVAILABLE",
    createdAt: "2026-09-10T10:20:00",
  },
  {
    id: "INV-012",
    material_name: "CPVC Elbow 25mm",
    category: "Plumbing",
    site_id: "SITE-006",
    site_name: "Vasant Kunj",
    quantity: 35,
    unit: "Nos",
    minimum_stock: 50,
    status: "LOW_STOCK",
    createdAt: "2026-09-09T12:10:00",
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: "TXN-001",
    type: "RECEIPT",
    material_name: "Plywood 18mm",
    quantity: 50,
    unit: "Sheets",
    site_id: "SITE-001",
    site_name: "DLF Phase 1",
    reference: "GRN-2026-0912",
    createdAt: "2026-09-21T10:30:00",
  },
  {
    id: "TXN-002",
    type: "ISSUE",
    material_name: "Wall Paint - White",
    quantity: 20,
    unit: "Ltr",
    site_id: "SITE-002",
    site_name: "Golf Course Road",
    reference: "ISS-2026-044",
    createdAt: "2026-09-21T09:20:00",
  },
  {
    id: "TXN-003",
    type: "RECEIPT",
    material_name: "Electrical Wire 2.5mm",
    quantity: 300,
    unit: "Mtr",
    site_id: "SITE-003",
    site_name: "Sohna Road",
    reference: "GRN-2026-0911",
    createdAt: "2026-09-20T16:45:00",
  },
  {
    id: "TXN-004",
    type: "ISSUE",
    material_name: "Floor Tile 600x600",
    quantity: 120,
    unit: "Sqft",
    site_id: "SITE-004",
    site_name: "Sector 57",
    reference: "ISS-2026-043",
    createdAt: "2026-09-20T13:10:00",
  },
  {
    id: "TXN-005",
    type: "RECEIPT",
    material_name: "Cement OPC 43",
    quantity: 80,
    unit: "Bags",
    site_id: "SITE-005",
    site_name: "MG Road",
    reference: "GRN-2026-0910",
    createdAt: "2026-09-19T11:25:00",
  },
  {
    id: "TXN-006",
    type: "ISSUE",
    material_name: "PVC Pipe 25mm",
    quantity: 60,
    unit: "Mtr",
    site_id: "SITE-006",
    site_name: "Vasant Kunj",
    reference: "ISS-2026-042",
    createdAt: "2026-09-19T10:15:00",
  },
];

const MOCK_MOVEMENT_TREND = [
  { month: "Apr", received: 680, issued: 420 },
  { month: "May", received: 820, issued: 510 },
  { month: "Jun", received: 760, issued: 590 },
  { month: "Jul", received: 940, issued: 680 },
  { month: "Aug", received: 1120, issued: 760 },
  { month: "Sep", received: 980, issued: 720 },
];

const INVENTORY_STOCK_MIX = [
  {
    name: "Healthy Stock",
    value: MOCK_INVENTORY.filter((item) => item.quantity > item.minimum_stock)
      .length,
  },
  {
    name: "Low Stock",
    value: MOCK_INVENTORY.filter((item) => item.quantity <= item.minimum_stock)
      .length,
  },
];

const MOCK_SITES = [
  {
    id: "SITE-001",
    site_name: "DLF Phase 1",
  },
  {
    id: "SITE-002",
    site_name: "Golf Course Road",
  },
  {
    id: "SITE-003",
    site_name: "Sohna Road",
  },
  {
    id: "SITE-004",
    site_name: "Sector 57",
  },
  {
    id: "SITE-005",
    site_name: "MG Road",
  },
  {
    id: "SITE-006",
    site_name: "Vasant Kunj",
  },
];

/* ============================================================
   HELPERS
============================================================ */

const getCategory = (item) =>
  item.category || item.material?.category || "Other";

const getQuantity = (item) =>
  Number(item.quantity ?? item.current_quantity ?? item.currentQuantity ?? 0);

const getMinimumStock = (item) =>
  Number(
    item.minimum_stock ??
      item.minimumStock ??
      item.reorder_level ??
      item.reorderLevel ??
      0,
  );

const getSiteName = (item) =>
  item.site_name ||
  item.siteName ||
  item.site?.name ||
  item.site ||
  "Unknown Site";

/* ============================================================
   TOTAL INVENTORY
============================================================ */

export const InventoryTotal = () => {
  const total = MOCK_INVENTORY.length;

  return (
    <WidgetShell title="Total Stock Items">
      <Stat value={total} />
    </WidgetShell>
  );
};

/* ============================================================
   STOCK RECEIVED
============================================================ */

export const InventoryReceived = () => {
  const received = MOCK_TRANSACTIONS.filter((item) => {
    const type = String(item.type).toUpperCase();

    return type === "RECEIPT" || type === "RECEIVED" || type === "IN";
  }).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <WidgetShell title="Stock Received">
      <Stat value={received} />
    </WidgetShell>
  );
};

/* ============================================================
   STOCK ISSUED
============================================================ */

export const InventoryIssued = () => {
  const issued = MOCK_TRANSACTIONS.filter((item) => {
    const type = String(item.type).toUpperCase();

    return type === "ISSUE" || type === "ISSUED" || type === "OUT";
  }).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <WidgetShell title="Stock Issued">
      <Stat value={issued} />
    </WidgetShell>
  );
};

/* ============================================================
   LOW STOCK
============================================================ */

export const InventoryLowStock = () => {
  const lowStock = MOCK_INVENTORY.filter(
    (item) =>
      getMinimumStock(item) > 0 && getQuantity(item) <= getMinimumStock(item),
  ).length;

  return (
    <WidgetShell title="Low Stock">
      <Stat value={lowStock} />
    </WidgetShell>
  );
};

/* ============================================================
   INVENTORY BY CATEGORY
============================================================ */

export const InventoryByCategory = () => {
  const counts = {};

  MOCK_INVENTORY.forEach((item) => {
    const category = getCategory(item);

    counts[category] = (counts[category] || 0) + 1;
  });

  const categories = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const max = Math.max(1, ...categories.map(([, count]) => count));

  return (
    <WidgetShell title="Inventory by Category">
      <div className="flex flex-col gap-2 mt-1">
        {categories.map(([category, count]) => (
          <div key={category} className="text-[11.5px]">
            <div className="flex justify-between mb-0.5">
              <span className="text-[#333333] truncate">{category}</span>

              <span className="text-[#6B7B7C] font-semibold">{count}</span>
            </div>

            <div className="h-1.5 rounded-full bg-[#1F453B]/8 overflow-hidden">
              <div
                style={{
                  width: `${(count / max) * 100}%`,
                  background: "#000",
                }}
                className="h-full"
              />
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-[12px] text-[#B5C4B6]">No inventory</div>
        )}
      </div>
    </WidgetShell>
  );
};

/* ============================================================
   RECENTLY ADDED INVENTORY
============================================================ */

export const InventoryRecentlyAdded = () => {
  const navigate = useNavigate();

  const rows = MOCK_INVENTORY.slice(0, 5).map((item) => ({
    id: item.id,

    title: item.material_name,

    subtitle: item.site_name || item.category || "Inventory",

    right: relativeTime(item.createdAt),
  }));

  return (
    <WidgetShell title="Recently Added Inventory">
      <RowList
        rows={rows}
        onClick={(row) => navigate(`/inventory/site-inventory/${row.id}`)}
        empty="No inventory added recently"
      />
    </WidgetShell>
  );
};

/* ============================================================
   INVENTORY PERFORMANCE / SUMMARY
============================================================ */

export const InventoryPerformance = () => {
  const totalQuantity = MOCK_INVENTORY.reduce(
    (sum, item) => sum + getQuantity(item),
    0,
  );

  const lowStock = MOCK_INVENTORY.filter(
    (item) =>
      getMinimumStock(item) > 0 && getQuantity(item) <= getMinimumStock(item),
  ).length;

  const activeSites = new Set(
    MOCK_INVENTORY.map((item) => item.site_id).filter(Boolean),
  ).size;

  return (
    <WidgetShell
      title="Inventory Summary"
      subtitle="current inventory position"
    >
      <div className="grid grid-cols-3 gap-3 mt-1 h-full">
        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Quantity
          </div>

          <div className="text-[34px] font-bold text-[#333333]">
            {totalQuantity.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Low Stock
          </div>

          <div className="text-[34px] font-bold text-[#333333]">{lowStock}</div>
        </div>

        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Sites
          </div>

          <div className="text-[34px] font-bold text-[#333333]">
            {activeSites}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
};

/* ============================================================
   SITE-WISE INVENTORY
============================================================ */

export const InventorySiteWise = () => {
  const navigate = useNavigate();

  const items = useMemo(() => {
    return MOCK_SITES.map((site) => {
      const siteItems = MOCK_INVENTORY.filter(
        (item) => item.site_id === site.id,
      );

      const totalQuantity = siteItems.reduce(
        (sum, item) => sum + getQuantity(item),
        0,
      );

      const lowStockCount = siteItems.filter(
        (item) =>
          getMinimumStock(item) > 0 &&
          getQuantity(item) <= getMinimumStock(item),
      ).length;

      return {
        ...site,
        item_count: siteItems.length,
        total_quantity: totalQuantity,
        low_stock_count: lowStockCount,
      };
    });
  }, []);

  return (
    <WidgetShell
      title="Site-Wise Inventory"
      subtitle={`${items.length} site${items.length !== 1 ? "s" : ""}`}
    >
      <div className="overflow-y-auto h-full">
        <table className="w-full text-[13px]">
          <thead
            className="
              text-[10px]
              uppercase
              tracking-[0.14em]
              text-[#6B7B7C]
              border-b
              border-[#D8E0DA]
            "
          >
            <tr>
              <th className="text-left py-1.5">Site</th>
              <th className="text-center">Items</th>
              <th className="text-center">Quantity</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#D8E0DA]">
            {items.slice(0, 7).map((item) => {
              const lowStock = item.low_stock_count || 0;

              return (
                <tr
                  key={item.id}
                  onClick={() =>
                    navigate(
                      `/inventory/site-inventory?site_id=${encodeURIComponent(
                        item.id,
                      )}`,
                    )
                  }
                  className="
                    cursor-pointer
                    hover:bg-[#EAEEF0]
                  "
                >
                  <td className="py-1.5 pr-2 truncate max-w-[150px]">
                    <span className="font-semibold text-[#333333]">
                      {item.site_name}
                    </span>
                  </td>

                  <td className="text-center text-[#333333] font-semibold">
                    {item.item_count}
                  </td>

                  <td className="text-center text-[#333333] font-semibold">
                    {Number(item.total_quantity).toLocaleString()}
                  </td>

                  <td className="text-center">
                    <span
                      className={`text-[10px] font-semibold ${
                        lowStock > 0 ? "text-[#6B7B7C]" : "text-[#333333]"
                      }`}
                    >
                      {lowStock > 0 ? `${lowStock} low` : "Healthy"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="
                    text-center
                    text-[#B5C4B6]
                    py-4
                  "
                >
                  No site inventory
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
};

/* ============================================================
   LOW STOCK / REQUIRING ATTENTION
============================================================ */

export const InventoryAttention = () => {
  const navigate = useNavigate();

  const count = MOCK_INVENTORY.filter(
    (item) =>
      getMinimumStock(item) > 0 && getQuantity(item) <= getMinimumStock(item),
  ).length;

  return (
    <WidgetShell
      title="Requiring Attention"
      action={
        count > 0 ? (
          <button
            onClick={() =>
              navigate("/inventory/site-inventory?filter=low_stock")
            }
            className="
              text-[10px]
              text-[#333333]
              font-semibold
              hover:underline
            "
          >
            Review →
          </button>
        ) : null
      }
    >
      <Stat value={count} />
    </WidgetShell>
  );
};

/* ============================================================
   LOW STOCK ITEMS LIST
============================================================ */

export const InventoryLowStockList = () => {
  const navigate = useNavigate();

  const rows = MOCK_INVENTORY.filter(
    (item) =>
      getMinimumStock(item) > 0 && getQuantity(item) <= getMinimumStock(item),
  )
    .slice(0, 5)
    .map((item) => ({
      id: item.id,

      title: item.material_name,

      subtitle: item.site_name,

      right: `${getQuantity(item)} ${item.unit || ""}`,
    }));

  return (
    <WidgetShell title="Low Stock Items" subtitle="items below minimum level">
      <RowList
        rows={rows}
        onClick={(row) => navigate(`/inventory/site-inventory/${row.id}`)}
        empty="No low stock items"
      />
    </WidgetShell>
  );
};

/* ============================================================
   INVENTORY MOVEMENT TREND
============================================================ */

export const InventoryMovementTrend = () => (
  <WidgetShell
    title="Inventory Movement"
    subtitle="received vs issued · 6 months"
  >
    <div className="h-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={MOCK_MOVEMENT_TREND}
          margin={{
            top: 10,
            right: 10,
            left: -15,
            bottom: 0,
          }}
        >
          <CartesianGrid stroke={CHART.mist} vertical={false} />

          <XAxis
            dataKey="month"
            tick={{
              fill: CHART.muted,
              fontSize: 11,
            }}
            axisLine={{
              stroke: CHART.stroke,
            }}
            tickLine={false}
          />

          <YAxis
            tick={{
              fill: CHART.muted,
              fontSize: 11,
            }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${CHART.stroke}`,
              fontSize: 12,
            }}
          />

          <Bar
            dataKey="received"
            name="Received"
            fill={CHART.primary}
            radius={[4, 4, 0, 0]}
          />

          <Bar
            dataKey="issued"
            name="Issued"
            fill={CHART.secondary || CHART.muted}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </WidgetShell>
);

/* ============================================================
   INVENTORY STOCK MIX
============================================================ */

export const InventoryStockMix = () => (
  <DonutMix
    title="Stock Availability"
    subtitle="current inventory mix"
    url="/dashboards/inventory/stock-mix"
    transform={() => INVENTORY_STOCK_MIX}
  />
);

/* ============================================================
   CATEGORY BAR CHART
============================================================ */

export const InventoryCategoryBar = () => {
  const navigate = useNavigate();

  const categoryMap = {};

  MOCK_INVENTORY.forEach((item) => {
    const category = getCategory(item);

    categoryMap[category] = (categoryMap[category] || 0) + 1;
  });

  const data = Object.entries(categoryMap)
    .map(([category, count]) => ({
      category,
      name: category,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <WidgetShell
      title="Inventory by Category"
      subtitle={`top ${data.length} · click to open`}
    >
      <div className="h-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 4,
              right: 24,
              left: 8,
              bottom: 4,
            }}
            onClick={(event) => {
              const payload = event?.activePayload?.[0]?.payload;

              if (payload) {
                navigate(
                  `/inventory/site-inventory?category=${encodeURIComponent(
                    payload.category || payload.name,
                  )}`,
                );
              }
            }}
          >
            <CartesianGrid stroke={CHART.mist} horizontal={false} />

            <XAxis
              type="number"
              tick={{
                fill: CHART.muted,
                fontSize: 13,
              }}
              axisLine={{
                stroke: CHART.stroke,
              }}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="name"
              tick={{
                fill: CHART.muted,
                fontSize: 13,
              }}
              axisLine={false}
              tickLine={false}
              width={100}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${CHART.stroke}`,
                fontSize: 12,
              }}
            />

            <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={CHART.primary}>
              <LabelList
                dataKey="count"
                position="right"
                style={{
                  fill: CHART.primary,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
};

/* ============================================================
   SITE-WISE INVENTORY BAR
============================================================ */

export const InventorySiteBar = () => {
  const navigate = useNavigate();

  const data = MOCK_SITES.map((site) => {
    const siteItems = MOCK_INVENTORY.filter((item) => item.site_id === site.id);

    return {
      ...site,
      name: site.site_name,
      count: siteItems.length,
    };
  }).slice(0, 8);

  return (
    <WidgetShell
      title="Inventory by Site"
      subtitle={`top ${data.length} · click to open`}
    >
      <div className="h-full min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 4,
              right: 24,
              left: 8,
              bottom: 4,
            }}
            onClick={(event) => {
              const payload = event?.activePayload?.[0]?.payload;

              if (!payload) return;

              const siteId = payload.id;

              if (siteId) {
                navigate(
                  `/inventory/site-inventory?site_id=${encodeURIComponent(
                    siteId,
                  )}`,
                );
              }
            }}
          >
            <CartesianGrid stroke={CHART.mist} horizontal={false} />

            <XAxis
              type="number"
              tick={{
                fill: CHART.muted,
                fontSize: 13,
              }}
              axisLine={{
                stroke: CHART.stroke,
              }}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="name"
              tick={{
                fill: CHART.muted,
                fontSize: 13,
              }}
              axisLine={false}
              tickLine={false}
              width={120}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${CHART.stroke}`,
                fontSize: 12,
              }}
            />

            <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={CHART.primary}>
              <LabelList
                dataKey="count"
                position="right"
                style={{
                  fill: CHART.primary,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  );
};

/* ============================================================
   RECENT INVENTORY TRANSACTIONS
============================================================ */

export const InventoryRecentTransactions = () => {
  const navigate = useNavigate();

  return (
    <IconListWidget
      title="Recent Transactions"
      subtitle="latest stock movements"
      data={MOCK_TRANSACTIONS.slice(0, 5)}
      iconFor={(item) => {
        const type = String(item.type).toUpperCase();

        const isReceipt =
          type === "RECEIPT" || type === "RECEIVED" || type === "IN";

        return (
          <div className="text-[11px] font-bold">
            {isReceipt ? "IN" : "OUT"}
          </div>
        );
      }}
      primary={(item) => item.material_name || "Material"}
      secondary={(item) =>
        item.reference || item.site_name || "Inventory transaction"
      }
      right={(item) => `${Number(item.quantity || 0)} ${item.unit || ""}`}
      onClick={(item) => {
        if (item.id) {
          navigate(`/inventory/transactions/${item.id}`);
        } else {
          navigate("/inventory/transactions");
        }
      }}
    />
  );
};

/* ============================================================
   CATEGORY-WISE INVENTORY WITH EXPAND
============================================================ */

export const InventoryCategoryWise = () => {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);

  const items = useMemo(() => {
    const map = {};

    MOCK_INVENTORY.forEach((item) => {
      const category = getCategory(item);

      if (!map[category]) {
        map[category] = {
          category,
          count: 0,
          total_quantity: 0,
        };
      }

      map[category].count += 1;
      map[category].total_quantity += getQuantity(item);
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, []);

  const visible = expanded ? items : items.slice(0, 7);

  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <WidgetShell
      title="Category-Wise Inventory"
      subtitle={`${items.length} categorie${items.length !== 1 ? "s" : ""}`}
    >
      <div className="flex flex-col gap-1.5 h-full overflow-y-auto pr-1">
        {visible.map((item) => {
          const category = item.category;
          const count = item.count;
          const quantity = item.total_quantity;

          return (
            <button
              key={category}
              onClick={() =>
                navigate(
                  `/inventory/site-inventory?category=${encodeURIComponent(
                    category,
                  )}`,
                )
              }
              className="text-left group"
              data-testid={`inventory-cat-${category}`}
            >
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="font-semibold text-[#333333] truncate">
                  {category}
                </span>

                <span className="text-[#6B7B7C]">
                  <span className="font-semibold text-[#333333]">{count}</span>
                  {" · "}
                  {Number(quantity).toLocaleString()} units
                </span>
              </div>

              <div className="h-2 rounded-full bg-[#EAEEF0] overflow-hidden">
                <div
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: "#1F453B",
                  }}
                  className="h-full group-hover:opacity-80"
                />
              </div>
            </button>
          );
        })}

        {items.length > 7 && (
          <button
            onClick={() => setExpanded((value) => !value)}
            className="
              text-[10.5px]
              text-[#6B7B7C]
              font-semibold
              hover:text-[#333333]
              mt-1
              text-left
            "
          >
            {expanded ? "Show less" : `Show ${items.length - 7} more`}
          </button>
        )}

        {items.length === 0 && (
          <div
            className="
              text-[12px]
              text-[#B5C4B6]
              py-6
              text-center
            "
          >
            No inventory yet
          </div>
        )}
      </div>
    </WidgetShell>
  );
};

/* ============================================================
   INVENTORY TRANSACTIONS SUMMARY
============================================================ */

export const InventoryTransactionsSummary = () => {
  const received = MOCK_TRANSACTIONS.filter(
    (item) => String(item.type).toUpperCase() === "RECEIPT",
  ).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const issued = MOCK_TRANSACTIONS.filter(
    (item) => String(item.type).toUpperCase() === "ISSUE",
  ).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const netMovement = received - issued;

  return (
    <WidgetShell title="Stock Movement" subtitle="current period">
      <div className="grid grid-cols-3 gap-3 mt-1">
        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Received
          </div>

          <div className="text-[30px] font-bold text-[#333333]">
            {received.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Issued
          </div>

          <div className="text-[30px] font-bold text-[#333333]">
            {issued.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Net
          </div>

          <div className="text-[30px] font-bold text-[#333333]">
            {netMovement > 0 ? "+" : ""}
            {netMovement.toLocaleString()}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
};

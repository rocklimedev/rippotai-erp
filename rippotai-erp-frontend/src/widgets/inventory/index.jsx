import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetWsInventoryOverviewQuery } from "@/api/workspace/workspace.api";

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
   LIVE INVENTORY DATA — GET /inventory-overview (inventory_transactions)
   stock:     per project (site) × material balance (received − issued)
   movements: latest 300 transactions
   Low stock: balance at or below 15% of what was received for that site.
============================================================ */

const LOW_STOCK_SHARE = 0.15;

function useInventoryData() {
  const { data, isLoading } = useGetWsInventoryOverviewQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: true,
  });
  return useMemo(() => {
    const stock = Array.isArray(data?.stock) ? data.stock : [];
    const moves = Array.isArray(data?.movements) ? data.movements : [];
    const inventory = stock.map((r) => {
      const received = Number(r.received || 0);
      const balance = Math.max(0, Math.round(Number(r.balance || 0) * 100) / 100);
      const minimum = Math.round(received * LOW_STOCK_SHARE * 100) / 100;
      return {
        id: `${r.project_id}:${r.material_id}`,
        material_id: r.material_id,
        material_name: r.material_name,
        material_code: r.material_code,
        category: r.category || "Other",
        site_id: r.project_id,
        site_name: r.project_name || "Unassigned",
        quantity: balance,
        received,
        issued: Number(r.issued || 0),
        unit: r.unit || "",
        minimum_stock: minimum,
        status: balance <= minimum ? "LOW_STOCK" : "AVAILABLE",
        createdAt: r.last_movement,
      };
    });
    const transactions = moves.map((m) => ({
      id: m.id,
      type: m.direction === "IN" ? "RECEIPT" : "ISSUE",
      material_name: m.material_name,
      quantity: Math.round(Number(m.quantity || 0) * 100) / 100,
      unit: m.unit || "",
      site_id: m.project_id,
      site_name: m.project_name,
      reference: [m.project_name, m.issued_to || m.storage_location].filter(Boolean).join(" · "),
      createdAt: m.transaction_date,
    }));
    // movement count per month (quantities are in mixed units, so they are not summed)
    const now = new Date();
    const trend = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inMonth = moves.filter((m) => String(m.transaction_date || "").slice(0, 7) === key);
      trend.push({
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        received: inMonth.filter((m) => m.direction === "IN").length,
        issued: inMonth.filter((m) => m.direction !== "IN").length,
      });
    }
    const sites = (Array.isArray(data?.projects) ? data.projects : []).map((p) => ({ id: p.id, site_name: p.name }));
    const stockMix = [
      { name: "Healthy Stock", value: inventory.filter((i) => i.status !== "LOW_STOCK").length },
      { name: "Low Stock", value: inventory.filter((i) => i.status === "LOW_STOCK").length },
    ];
    return { inventory, transactions, trend, sites, stockMix, isLoading: isLoading && !data };
  }, [data, isLoading]);
}

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
  const { inventory, transactions, sites } = useInventoryData();
  const total = inventory.length;

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
  const { inventory, transactions, sites } = useInventoryData();
  const received = transactions.filter((item) => {
    const type = String(item.type).toUpperCase();

    return type === "RECEIPT" || type === "RECEIVED" || type === "IN";
  }).length; // entries — quantities are in mixed units

  return (
    <WidgetShell title="Stock Received">
      <Stat value={received} note="receipt entries" />
    </WidgetShell>
  );
};

/* ============================================================
   STOCK ISSUED
============================================================ */

export const InventoryIssued = () => {
  const { inventory, transactions, sites } = useInventoryData();
  const issued = transactions.filter((item) => {
    const type = String(item.type).toUpperCase();

    return type === "ISSUE" || type === "ISSUED" || type === "OUT";
  }).length; // entries — quantities are in mixed units

  return (
    <WidgetShell title="Stock Issued">
      <Stat value={issued} note="issue entries" />
    </WidgetShell>
  );
};

/* ============================================================
   LOW STOCK
============================================================ */

export const InventoryLowStock = () => {
  const { inventory, transactions, sites } = useInventoryData();
  const lowStock = inventory.filter(
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
  const { inventory, transactions, sites } = useInventoryData();
  const counts = {};

  inventory.forEach((item) => {
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
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const rows = inventory.slice(0, 5).map((item) => ({
    id: item.id,

    title: item.material_name,

    subtitle: item.site_name || item.category || "Inventory",

    right: relativeTime(item.createdAt),
  }));

  return (
    <WidgetShell title="Recently Added Inventory">
      <RowList
        rows={rows}
        onClick={(row) => navigate(`/inventory/site-inventory/all?project_id=${encodeURIComponent(String(row.id).split(":")[0])}`)}
        empty="No inventory added recently"
      />
    </WidgetShell>
  );
};

/* ============================================================
   INVENTORY PERFORMANCE / SUMMARY
============================================================ */

export const InventoryPerformance = () => {
  const { inventory, transactions, sites } = useInventoryData();
  const totalQuantity = inventory.length; // site × material lines (units differ, so not summed)

  const lowStock = inventory.filter(
    (item) =>
      getMinimumStock(item) > 0 && getQuantity(item) <= getMinimumStock(item),
  ).length;

  const activeSites = new Set(
    inventory.map((item) => item.site_id).filter(Boolean),
  ).size;

  return (
    <WidgetShell
      title="Inventory Summary"
      subtitle="current inventory position"
    >
      <div className="grid grid-cols-3 gap-3 mt-1 h-full">
        <div>
          <div className="text-[10.5px] text-[#6B7B7C] uppercase font-semibold">
            Stock lines
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
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const items = useMemo(() => {
    return sites.map((site) => {
      const siteItems = inventory.filter(
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
        last_movement: siteItems.reduce((m, i) => (String(i.createdAt || "") > m ? String(i.createdAt) : m), ""),
      };
    });
  }, [inventory, sites]);

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
              <th className="text-center">Last movement</th>
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
                      `/inventory/site-inventory/all?project_id=${encodeURIComponent(
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

                  <td className="text-center text-[#6B7B7C]">
                    {item.last_movement ? relativeTime(item.last_movement) : "—"}
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
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const count = inventory.filter(
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
              navigate("/inventory/site-inventory/all")
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
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const rows = inventory.filter(
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
        onClick={(row) => navigate(`/inventory/site-inventory/all?project_id=${encodeURIComponent(String(row.id).split(":")[0])}`)}
        empty="No low stock items"
      />
    </WidgetShell>
  );
};

/* ============================================================
   INVENTORY MOVEMENT TREND
============================================================ */

export const InventoryMovementTrend = () => {
  const { trend } = useInventoryData();
  return (
  <WidgetShell
    title="Inventory Movement"
    subtitle="receipts vs issues (entries) · 6 months"
  >
    <div className="h-full min-h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={trend}
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
};

/* ============================================================
   INVENTORY STOCK MIX
============================================================ */

export const InventoryStockMix = () => {
  const { stockMix, isLoading } = useInventoryData();
  return (
    <DonutMix
      title="Stock Availability"
      subtitle="site × material lines"
      data={stockMix}
      isLoading={isLoading}
    />
  );
};

/* ============================================================
   CATEGORY BAR CHART
============================================================ */

export const InventoryCategoryBar = () => {
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const categoryMap = {};

  inventory.forEach((item) => {
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
                  "/inventory/site-inventory/all",
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
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const data = sites.map((site) => {
    const siteItems = inventory.filter((item) => item.site_id === site.id);

    return {
      ...site,
      name: site.site_name,
      count: siteItems.length,
    };
  }).sort((a, b) => b.count - a.count).slice(0, 8);

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
                  `/inventory/site-inventory/all?project_id=${encodeURIComponent(
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
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  return (
    <IconListWidget
      title="Recent Transactions"
      subtitle="latest stock movements"
      data={transactions.slice(0, 5)}
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
          navigate("/inventory/site-inventory/transactions");
        } else {
          navigate("/inventory/site-inventory/transactions");
        }
      }}
    />
  );
};

/* ============================================================
   CATEGORY-WISE INVENTORY WITH EXPAND
============================================================ */

export const InventoryCategoryWise = () => {
  const { inventory, transactions, sites } = useInventoryData();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);

  const items = useMemo(() => {
    const map = {};

    inventory.forEach((item) => {
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
  }, [inventory]);

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
                  "/inventory/site-inventory/all",
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
  const { inventory, transactions, sites } = useInventoryData();
  const received = transactions.filter(
    (item) => String(item.type).toUpperCase() === "RECEIPT",
  ).length; // entries — quantities are in mixed units

  const issued = transactions.filter(
    (item) => String(item.type).toUpperCase() === "ISSUE",
  ).length; // entries — quantities are in mixed units

  const netMovement = received - issued;

  return (
    <WidgetShell title="Stock Movement" subtitle="entries · last 300 movements">
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

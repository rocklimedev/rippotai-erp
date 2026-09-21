import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Warehouse,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Boxes,
  Clock3,
  MapPin,
} from "lucide-react";

import { Shell, Card } from "@/hooks/shared";

/* ============================================================
   MOCK DATA
============================================================ */

const MOCK_STATS = {
  totalStockItems: 128,
  stockReceived: 486,
  stockIssued: 327,
  lowStock: 12,
};

const MOCK_STOCK = [
  {
    id: 1,
    material: "18mm BWP Plywood",
    code: "PLY-001",
    category: "Plywood",
    site: "DLF Phase 5",
    quantity: 42,
    unit: "Sheets",
    minimumStock: 20,
    status: "IN_STOCK",
  },
  {
    id: 2,
    material: "Fevicol SH",
    code: "ADH-014",
    category: "Adhesive",
    site: "DLF Phase 5",
    quantity: 8,
    unit: "Kg",
    minimumStock: 15,
    status: "LOW_STOCK",
  },
  {
    id: 3,
    material: "Hettich Soft Close Hinge",
    code: "HDW-102",
    category: "Hardware",
    site: "Golf Course Road",
    quantity: 126,
    unit: "Nos",
    minimumStock: 50,
    status: "IN_STOCK",
  },
  {
    id: 4,
    material: "6mm Toughened Glass",
    code: "GLS-006",
    category: "Glass",
    site: "Sector 54",
    quantity: 18,
    unit: "Sq.Ft",
    minimumStock: 25,
    status: "LOW_STOCK",
  },
  {
    id: 5,
    material: "Oak Veneer",
    code: "VEN-022",
    category: "Veneer",
    site: "DLF Phase 5",
    quantity: 34,
    unit: "Sheets",
    minimumStock: 15,
    status: "IN_STOCK",
  },
];

const MOCK_TRANSACTIONS = [
  {
    id: 1,
    material: "18mm BWP Plywood",
    type: "RECEIPT",
    quantity: 50,
    unit: "Sheets",
    site: "DLF Phase 5",
    date: "21 Sep 2026",
    reference: "DC-2026-0098",
  },
  {
    id: 2,
    material: "Hettich Soft Close Hinge",
    type: "ISSUE",
    quantity: 24,
    unit: "Nos",
    site: "Golf Course Road",
    date: "21 Sep 2026",
    reference: "ISS-2026-0042",
  },
  {
    id: 3,
    material: "Oak Veneer",
    type: "RECEIPT",
    quantity: 20,
    unit: "Sheets",
    site: "DLF Phase 5",
    date: "20 Sep 2026",
    reference: "DC-2026-0095",
  },
  {
    id: 4,
    material: "Fevicol SH",
    type: "ISSUE",
    quantity: 12,
    unit: "Kg",
    site: "DLF Phase 5",
    date: "20 Sep 2026",
    reference: "ISS-2026-0039",
  },
];

/* ============================================================
   COMPONENT
============================================================ */

const InventoryDashboard = () => {
  const navigate = useNavigate();

  const stats = useMemo(
    () => [
      {
        label: "Total Stock Items",
        value: MOCK_STATS.totalStockItems,
        icon: Package,
        description: "Materials currently tracked",
      },
      {
        label: "Stock Received",
        value: MOCK_STATS.stockReceived,
        icon: ArrowDownToLine,
        description: "Units received this month",
      },
      {
        label: "Stock Issued",
        value: MOCK_STATS.stockIssued,
        icon: ArrowUpFromLine,
        description: "Units issued this month",
      },
      {
        label: "Low Stock",
        value: MOCK_STATS.lowStock,
        icon: AlertTriangle,
        description: "Items requiring attention",
      },
    ],
    [],
  );

  const quickActions = [
    {
      title: "Site Inventory",
      description: "View and manage project/site stock",
      icon: Warehouse,
      path: "/inventory/site-inventory",
    },
    {
      title: "Stock Transactions",
      description: "View all inventory movements",
      icon: ClipboardList,
      path: "/inventory/transactions",
    },
    {
      title: "Receive Stock",
      description: "Record incoming material",
      icon: ArrowDownToLine,
      path: "/inventory/transactions/new?type=RECEIPT",
    },
    {
      title: "Issue Stock",
      description: "Issue material to a project or site",
      icon: ArrowUpFromLine,
      path: "/inventory/transactions/new?type=ISSUE",
    },
  ];

  const lowStockItems = MOCK_STOCK.filter(
    (item) => item.quantity <= item.minimumStock,
  );

  return (
    <Shell>
      <div className="space-y-6">
        {/* ============================================================
            HEADER
        ============================================================ */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Boxes size={24} className="text-[#1F453B]" />

              <h1 className="text-2xl font-semibold text-[#1F453B]">
                Inventory Dashboard
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Monitor site inventory, stock movements, and material
              availability.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/inventory/site-inventory")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1F453B] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Package size={17} />
            Site Inventory
          </button>
        </div>

        {/* ============================================================
            STATS
        ============================================================ */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Card key={stat.label} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      {stat.label}
                    </p>

                    <p className="mt-2 text-3xl font-semibold text-[#1F453B]">
                      {stat.value.toLocaleString()}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {stat.description}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D8E0DA] text-[#1F453B]">
                    <Icon size={20} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ============================================================
            QUICK ACTIONS
        ============================================================ */}

        <div>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#1F453B]">
              Quick Actions
            </h2>

            <p className="text-sm text-gray-500">Common inventory operations</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group text-left"
                >
                  <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EAEEF0] text-[#1F453B]">
                        <Icon size={21} />
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-[#1F453B]"
                      />
                    </div>

                    <h3 className="mt-4 font-semibold text-[#1F453B]">
                      {action.title}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-gray-500">
                      {action.description}
                    </p>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            STOCK OVERVIEW + LOW STOCK
        ============================================================ */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* STOCK TABLE */}

          <Card className="overflow-hidden xl:col-span-2">
            <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-[#1F453B]">Current Stock</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Current material availability across sites.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/inventory/site-inventory")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F453B] hover:underline"
              >
                View All
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-[#EAEEF0] text-left">
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Material
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Site
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {MOCK_STOCK.map((item) => {
                    const isLow = item.quantity <= item.minimumStock;

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-[#1F453B]">
                              {item.material}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              {item.code} · {item.category}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin size={14} />
                            {item.site}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-gray-700">
                            {item.quantity.toLocaleString()}
                          </span>

                          <span className="ml-1 text-xs text-gray-400">
                            {item.unit}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              isLow
                                ? "bg-red-50 text-red-600"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {isLow ? "Low Stock" : "In Stock"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* LOW STOCK */}

          <Card className="overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={19} className="text-amber-600" />

                <h2 className="font-semibold text-[#1F453B]">Low Stock</h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Materials below minimum stock level.
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {lowStockItems.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#1F453B]">
                        {item.material}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">{item.site}</p>
                    </div>

                    <span className="text-sm font-semibold text-red-600">
                      {item.quantity} {item.unit}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Minimum: {item.minimumStock} {item.unit}
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate("/inventory/site-inventory")}
                      className="font-medium text-[#1F453B] hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-4">
              <button
                type="button"
                onClick={() => navigate("/inventory/site-inventory")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-[#1F453B] hover:bg-[#EAEEF0]"
              >
                View All Low Stock
                <ChevronRight size={16} />
              </button>
            </div>
          </Card>
        </div>

        {/* ============================================================
            RECENT TRANSACTIONS
        ============================================================ */}

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock3 size={19} className="text-[#1F453B]" />

                <h2 className="font-semibold text-[#1F453B]">
                  Recent Transactions
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Latest material inward and outward movements.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/inventory/transactions")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F453B] hover:underline"
            >
              View Transactions
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-[#EAEEF0] text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Material
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quantity
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Site
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Reference
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {MOCK_TRANSACTIONS.map((transaction) => {
                  const isReceipt = transaction.type === "RECEIPT";

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-[#1F453B]">
                          {transaction.material}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            isReceipt
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {isReceipt ? (
                            <ArrowDownToLine size={13} />
                          ) : (
                            <ArrowUpFromLine size={13} />
                          )}

                          {isReceipt ? "Received" : "Issued"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-gray-700">
                          {transaction.quantity}
                        </span>

                        <span className="ml-1 text-xs text-gray-400">
                          {transaction.unit}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {transaction.site}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-gray-600">
                          {transaction.reference}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500">
                          {transaction.date}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ============================================================
            INVENTORY STATUS
        ============================================================ */}

        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D8E0DA] text-[#1F453B]">
                <RefreshCw size={19} />
              </div>

              <div>
                <h3 className="font-medium text-[#1F453B]">
                  Inventory Tracking
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Inventory balances are calculated from recorded material
                  transactions.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/inventory/site-inventory")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1F453B] px-4 py-2 text-sm font-medium text-[#1F453B] transition hover:bg-[#EAEEF0]"
            >
              Open Inventory
              <ChevronRight size={16} />
            </button>
          </div>
        </Card>
      </div>
    </Shell>
  );
};

export default InventoryDashboard;

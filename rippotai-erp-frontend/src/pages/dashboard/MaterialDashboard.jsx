import React, { useMemo, useState } from "react";
import {
  Package,
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Clock3,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  Eye,
  ArrowRight,
  Warehouse,
  Truck,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Shell, Card, Input } from "../../hooks/shared";

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_STATS = {
  totalMaterials: 1248,
  totalStockUnits: 18642,
  stockValue: 42850000,

  lowStock: 37,
  outOfStock: 8,

  pendingRequests: 24,
  approvedRequests: 61,

  activePurchaseOrders: 18,
  pendingDeliveries: 11,

  inwardToday: 284,
  outwardToday: 197,

  pendingGRN: 7,
};

const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "Tiles",
    items: 286,
    stock: 4820,
    value: 12450000,
    lowStock: 8,
  },
  {
    id: 2,
    name: "Sanitaryware",
    items: 174,
    stock: 2140,
    value: 6840000,
    lowStock: 4,
  },
  {
    id: 3,
    name: "Bath Fittings",
    items: 212,
    stock: 3280,
    value: 5720000,
    lowStock: 7,
  },
  {
    id: 4,
    name: "Electrical",
    items: 168,
    stock: 2840,
    value: 4180000,
    lowStock: 6,
  },
  {
    id: 5,
    name: "Hardware",
    items: 194,
    stock: 3142,
    value: 3860000,
    lowStock: 5,
  },
  {
    id: 6,
    name: "Plumbing",
    items: 214,
    stock: 2420,
    value: 3850000,
    lowStock: 7,
  },
];

const MOCK_LOW_STOCK = [
  {
    id: "MAT-1024",
    name: "600x1200 Matt Floor Tile",
    category: "Tiles",
    current: 18,
    minimum: 50,
    unit: "Boxes",
    warehouse: "Main Warehouse",
  },
  {
    id: "MAT-0842",
    name: "Concealed Cistern",
    category: "Sanitaryware",
    current: 7,
    minimum: 20,
    unit: "Nos",
    warehouse: "Main Warehouse",
  },
  {
    id: "MAT-1188",
    name: "CP Shower Mixer",
    category: "Bath Fittings",
    current: 12,
    minimum: 30,
    unit: "Nos",
    warehouse: "Site Store",
  },
  {
    id: "MAT-0931",
    name: "20mm PVC Conduit",
    category: "Electrical",
    current: 64,
    minimum: 150,
    unit: "Bundles",
    warehouse: "Main Warehouse",
  },
  {
    id: "MAT-0721",
    name: "Angle Valve 15mm",
    category: "Plumbing",
    current: 23,
    minimum: 60,
    unit: "Nos",
    warehouse: "Site Store",
  },
];

const MOCK_REQUESTS = [
  {
    id: "REQ-2026-084",
    project: "Villa Residence — Gurgaon",
    requestedBy: "Amit Sharma",
    items: 14,
    priority: "HIGH",
    status: "PENDING",
    date: "31 Aug 2026",
  },
  {
    id: "REQ-2026-083",
    project: "Corporate Office — Noida",
    requestedBy: "Rohit Mehta",
    items: 8,
    priority: "MEDIUM",
    status: "PENDING",
    date: "31 Aug 2026",
  },
  {
    id: "REQ-2026-081",
    project: "Penthouse — South Delhi",
    requestedBy: "Karan Singh",
    items: 21,
    priority: "HIGH",
    status: "APPROVED",
    date: "30 Aug 2026",
  },
  {
    id: "REQ-2026-079",
    project: "Farmhouse — Chhatarpur",
    requestedBy: "Vikas Kumar",
    items: 6,
    priority: "LOW",
    status: "PENDING",
    date: "30 Aug 2026",
  },
];

const MOCK_PURCHASE_ORDERS = [
  {
    id: "PO-2026-142",
    vendor: "Jaquar",
    project: "Villa Residence",
    amount: 485000,
    items: 18,
    status: "IN_TRANSIT",
    expected: "02 Sep 2026",
  },
  {
    id: "PO-2026-141",
    vendor: "Kajaria",
    project: "Penthouse",
    amount: 728000,
    items: 32,
    status: "CONFIRMED",
    expected: "04 Sep 2026",
  },
  {
    id: "PO-2026-139",
    vendor: "Finolex",
    project: "Corporate Office",
    amount: 218500,
    items: 11,
    status: "PENDING",
    expected: "06 Sep 2026",
  },
  {
    id: "PO-2026-136",
    vendor: "Hindware",
    project: "Farmhouse",
    amount: 364000,
    items: 15,
    status: "IN_TRANSIT",
    expected: "01 Sep 2026",
  },
];

const MOCK_MOVEMENTS = [
  {
    id: 1,
    type: "INWARD",
    material: "600x600 Porcelain Tile",
    quantity: 120,
    unit: "Boxes",
    location: "Main Warehouse",
    reference: "GRN-2026-418",
    time: "10:42 AM",
    user: "Rahul",
  },
  {
    id: 2,
    type: "OUTWARD",
    material: "CP Angle Valve",
    quantity: 48,
    unit: "Nos",
    location: "Villa Residence",
    reference: "ISS-2026-283",
    time: "10:05 AM",
    user: "Amit",
  },
  {
    id: 3,
    type: "INWARD",
    material: "Concealed Cistern",
    quantity: 32,
    unit: "Nos",
    location: "Site Store",
    reference: "GRN-2026-417",
    time: "09:24 AM",
    user: "Rahul",
  },
  {
    id: 4,
    type: "OUTWARD",
    material: "20mm PVC Conduit",
    quantity: 75,
    unit: "Bundles",
    location: "Corporate Office",
    reference: "ISS-2026-282",
    time: "09:02 AM",
    user: "Rohit",
  },
  {
    id: 5,
    type: "OUTWARD",
    material: "Wall Hung WC",
    quantity: 6,
    unit: "Nos",
    location: "Penthouse",
    reference: "ISS-2026-281",
    time: "08:41 AM",
    user: "Karan",
  },
];

const MOCK_ACTIVITY = [
  {
    id: 1,
    type: "INWARD",
    title: "GRN received",
    description: "120 boxes of 600x600 Porcelain Tile received",
    time: "10 min ago",
  },
  {
    id: 2,
    type: "REQUEST",
    title: "Material request submitted",
    description: "Villa Residence requested 14 materials",
    time: "35 min ago",
  },
  {
    id: 3,
    type: "PO",
    title: "Purchase order confirmed",
    description: "PO-2026-141 confirmed with Kajaria",
    time: "1 hr ago",
  },
  {
    id: 4,
    type: "OUTWARD",
    title: "Material issued",
    description: "48 Angle Valves issued to Villa Residence",
    time: "1 hr ago",
  },
  {
    id: 5,
    type: "ALERT",
    title: "Low stock alert",
    description: "Concealed Cistern has fallen below minimum stock",
    time: "2 hrs ago",
  },
];

const MOCK_DEADLINES = [
  {
    id: 1,
    title: "GRN verification",
    project: "Main Warehouse",
    date: "31 Aug",
    days: "Today",
    urgent: true,
  },
  {
    id: 2,
    title: "Material delivery",
    project: "Villa Residence",
    date: "01 Sep",
    days: "Tomorrow",
    urgent: true,
  },
  {
    id: 3,
    title: "Material delivery",
    project: "Farmhouse",
    date: "01 Sep",
    days: "Tomorrow",
    urgent: false,
  },
  {
    id: 4,
    title: "PO approval",
    project: "Corporate Office",
    date: "03 Sep",
    days: "3 days",
    urgent: false,
  },
];

// ============================================================
// HELPERS
// ============================================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat("en-IN").format(value);
};

const getRequestStatusClass = (status) => {
  switch (status) {
    case "APPROVED":
      return "bg-[#E8F3EE] text-[#1F453B]";
    case "PENDING":
      return "bg-[#FFF4DC] text-[#8A6500]";
    case "REJECTED":
      return "bg-[#FBEAEA] text-[#9B3D3D]";
    default:
      return "bg-[#F4F6F7] text-[#6B7B7C]";
  }
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case "HIGH":
      return "bg-[#FBEAEA] text-[#9B3D3D]";
    case "MEDIUM":
      return "bg-[#FFF4DC] text-[#8A6500]";
    case "LOW":
      return "bg-[#EAF1F8] text-[#315A7D]";
    default:
      return "bg-[#F4F6F7] text-[#6B7B7C]";
  }
};

const getPOStatusClass = (status) => {
  switch (status) {
    case "IN_TRANSIT":
      return "bg-[#EAF1F8] text-[#315A7D]";
    case "CONFIRMED":
      return "bg-[#E8F3EE] text-[#1F453B]";
    case "PENDING":
      return "bg-[#FFF4DC] text-[#8A6500]";
    default:
      return "bg-[#F4F6F7] text-[#6B7B7C]";
  }
};

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  trendValue,
  onClick,
}) {
  return (
    <Card
      className={`p-4 ${
        onClick ? "cursor-pointer hover:bg-[#F8FAF9] transition-colors" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-semibold text-[#7A8788] uppercase tracking-[0.08em]">
            {label}
          </div>

          <div className="mt-2 text-[24px] font-bold text-[#263333] leading-none">
            {value}
          </div>

          {description && (
            <div className="mt-2 text-[12px] text-[#8A9697]">{description}</div>
          )}
        </div>

        <div className="w-9 h-9 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
          <Icon size={17} className="text-[#1F453B]" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-[12px]">
          {trend === "up" ? (
            <TrendingUp size={13} className="text-[#276749]" />
          ) : (
            <TrendingDown size={13} className="text-[#9B3D3D]" />
          )}

          <span
            className={trend === "up" ? "text-[#276749]" : "text-[#9B3D3D]"}
          >
            {trendValue}
          </span>

          <span className="text-[#8A9697]">vs last month</span>
        </div>
      )}
    </Card>
  );
}

// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h2 className="text-[15px] font-bold text-[#333333]">{title}</h2>

        {subtitle && (
          <p className="text-[12px] text-[#8A9697] mt-0.5">{subtitle}</p>
        )}
      </div>

      {action}
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function MaterialsDashboard() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [movementFilter, setMovementFilter] = useState("ALL");

  // ==========================================================
  // FILTER LOW STOCK
  // ==========================================================

  const filteredLowStock = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) {
      return MOCK_LOW_STOCK;
    }

    return MOCK_LOW_STOCK.filter((item) =>
      [item.id, item.name, item.category, item.warehouse]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [q]);

  // ==========================================================
  // MOVEMENT FILTER
  // ==========================================================

  const filteredMovements = useMemo(() => {
    if (movementFilter === "ALL") {
      return MOCK_MOVEMENTS;
    }

    return MOCK_MOVEMENTS.filter(
      (movement) => movement.type === movementFilter,
    );
  }, [movementFilter]);

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Shell
      title="Materials Dashboard"
      subtitle="Inventory, procurement and material movement overview"
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav("/materials/inventory")}
            className="h-10 px-3 rounded-lg border border-[#DDE5E1] bg-white text-[#333333] text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7]"
          >
            <Boxes size={14} />
            Inventory
          </button>

          <button
            onClick={() => nav("/materials/forms/material-request")}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#17382F]"
            data-testid="materials-new-request-btn"
          >
            <Plus size={14} />
            Material Request
          </button>
        </div>
      }
    >
      {/* ======================================================
          TOP SEARCH
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Input
          placeholder="Search materials, categories, warehouses..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
          icon={<Search size={15} />}
        />

        <button
          className="h-9 px-3 rounded-lg border border-[#DDE5E1] bg-white text-[12px] font-semibold text-[#526061] inline-flex items-center gap-1.5 hover:bg-[#F4F6F7]"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* ======================================================
          INVENTORY KPIs
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <StatCard
          icon={Package}
          label="Total Materials"
          value={formatNumber(MOCK_STATS.totalMaterials)}
          description={`${formatNumber(MOCK_STATS.totalStockUnits)} units in stock`}
          trend="up"
          trendValue="+8.4%"
          onClick={() => nav("/materials/inventory")}
        />

        <StatCard
          icon={IndianRupee}
          label="Stock Value"
          value={formatCurrency(MOCK_STATS.stockValue)}
          description="Current inventory valuation"
          trend="up"
          trendValue="+5.7%"
        />

        <StatCard
          icon={AlertTriangle}
          label="Low Stock"
          value={MOCK_STATS.lowStock}
          description={`${MOCK_STATS.outOfStock} materials out of stock`}
          trend="down"
          trendValue="+4"
          onClick={() => nav("/materials/inventory?filter=low-stock")}
        />

        <StatCard
          icon={ClipboardList}
          label="Pending Requests"
          value={MOCK_STATS.pendingRequests}
          description={`${MOCK_STATS.approvedRequests} already approved`}
          trend="down"
          trendValue="+6"
          onClick={() => nav("/materials/requests")}
        />
      </div>

      {/* ======================================================
          MOVEMENT KPIs
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={ShoppingCart}
          label="Active Purchase Orders"
          value={MOCK_STATS.activePurchaseOrders}
          description={`${MOCK_STATS.pendingDeliveries} deliveries pending`}
          onClick={() => nav("/materials/purchase-orders")}
        />

        <StatCard
          icon={ArrowDownToLine}
          label="Inward Today"
          value={`${formatNumber(MOCK_STATS.inwardToday)} units`}
          description="Goods received today"
          trend="up"
          trendValue="+12.2%"
        />

        <StatCard
          icon={ArrowUpFromLine}
          label="Outward Today"
          value={`${formatNumber(MOCK_STATS.outwardToday)} units`}
          description="Material issued today"
          trend="up"
          trendValue="+7.8%"
        />

        <StatCard
          icon={CheckCircle2}
          label="Pending GRN"
          value={MOCK_STATS.pendingGRN}
          description="Receipts awaiting verification"
          onClick={() => nav("/materials/grn")}
        />
      </div>

      {/* ======================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* ====================================================
            CATEGORY OVERVIEW
        ==================================================== */}

        <Card className="xl:col-span-2 p-4">
          <SectionHeader
            title="Inventory by Category"
            subtitle="Current stock distribution and valuation"
            action={
              <button
                onClick={() => nav("/materials/inventory")}
                className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
              >
                View inventory
                <ArrowRight size={13} />
              </button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#E8EDEB]">
                  <th className="text-left py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#7A8788]">
                    Category
                  </th>

                  <th className="text-right py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#7A8788]">
                    Items
                  </th>

                  <th className="text-right py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#7A8788]">
                    Stock
                  </th>

                  <th className="text-right py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#7A8788]">
                    Value
                  </th>

                  <th className="text-right py-2.5 text-[10px] uppercase tracking-[0.12em] text-[#7A8788]">
                    Low Stock
                  </th>
                </tr>
              </thead>

              <tbody>
                {MOCK_CATEGORIES.map((category) => (
                  <tr
                    key={category.id}
                    className="border-b border-[#EEF2F0] last:border-0 hover:bg-[#F8FAF9] cursor-pointer"
                    onClick={() =>
                      nav(
                        `/materials/inventory?category=${encodeURIComponent(
                          category.name,
                        )}`,
                      )
                    }
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-[#EEF3F0] flex items-center justify-center">
                          <Package size={13} className="text-[#1F453B]" />
                        </div>

                        <span className="font-semibold text-[#394546]">
                          {category.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 text-right text-[#697677]">
                      {formatNumber(category.items)}
                    </td>

                    <td className="py-3 text-right text-[#697677]">
                      {formatNumber(category.stock)}
                    </td>

                    <td className="py-3 text-right font-medium text-[#394546]">
                      {formatCurrency(category.value)}
                    </td>

                    <td className="py-3 text-right">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-[11px] font-semibold ${
                          category.lowStock > 6
                            ? "bg-[#FBEAEA] text-[#9B3D3D]"
                            : "bg-[#FFF4DC] text-[#8A6500]"
                        }`}
                      >
                        {category.lowStock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ====================================================
            QUICK ACTIONS
        ==================================================== */}

        <Card className="p-4">
          <SectionHeader
            title="Quick Actions"
            subtitle="Common material operations"
          />

          <div className="space-y-2">
            <button
              onClick={() => nav("/materials/forms/material")}
              className="w-full p-3 rounded-lg border border-[#E1E8E4] hover:bg-[#F6F9F7] flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                <Plus size={15} className="text-[#1F453B]" />
              </div>

              <div>
                <div className="text-[13px] font-semibold text-[#394546]">
                  Add Material
                </div>
                <div className="text-[11px] text-[#8A9697]">
                  Create a new inventory item
                </div>
              </div>
            </button>

            <button
              onClick={() => nav("/materials/forms/material-request")}
              className="w-full p-3 rounded-lg border border-[#E1E8E4] hover:bg-[#F6F9F7] flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                <ClipboardList size={15} className="text-[#1F453B]" />
              </div>

              <div>
                <div className="text-[13px] font-semibold text-[#394546]">
                  Material Request
                </div>
                <div className="text-[11px] text-[#8A9697]">
                  Request materials for a project
                </div>
              </div>
            </button>

            <button
              onClick={() => nav("/materials/forms/purchase-order")}
              className="w-full p-3 rounded-lg border border-[#E1E8E4] hover:bg-[#F6F9F7] flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                <ShoppingCart size={15} className="text-[#1F453B]" />
              </div>

              <div>
                <div className="text-[13px] font-semibold text-[#394546]">
                  Create Purchase Order
                </div>
                <div className="text-[11px] text-[#8A9697]">
                  Raise a new material PO
                </div>
              </div>
            </button>

            <button
              onClick={() => nav("/materials/grn")}
              className="w-full p-3 rounded-lg border border-[#E1E8E4] hover:bg-[#F6F9F7] flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                <ArrowDownToLine size={15} className="text-[#1F453B]" />
              </div>

              <div>
                <div className="text-[13px] font-semibold text-[#394546]">
                  Receive Material
                </div>
                <div className="text-[11px] text-[#8A9697]">
                  Create or verify a GRN
                </div>
              </div>
            </button>

            <button
              onClick={() => nav("/materials/issue")}
              className="w-full p-3 rounded-lg border border-[#E1E8E4] hover:bg-[#F6F9F7] flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                <ArrowUpFromLine size={15} className="text-[#1F453B]" />
              </div>

              <div>
                <div className="text-[13px] font-semibold text-[#394546]">
                  Issue Material
                </div>
                <div className="text-[11px] text-[#8A9697]">
                  Issue stock to a project/site
                </div>
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* ======================================================
          LOW STOCK + REQUESTS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        {/* ====================================================
            LOW STOCK
        ==================================================== */}

        <Card className="p-4">
          <SectionHeader
            title="Low Stock Alerts"
            subtitle={`${MOCK_STATS.lowStock} materials require attention`}
            action={
              <button
                onClick={() => nav("/materials/inventory?filter=low-stock")}
                className="text-[12px] font-semibold text-[#9B3D3D] inline-flex items-center gap-1"
              >
                View all
                <ArrowRight size={13} />
              </button>
            }
          />

          <div className="space-y-2">
            {filteredLowStock.map((item) => {
              const percentage = Math.min(
                100,
                Math.round((item.current / item.minimum) * 100),
              );

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-[#E8EDEB] hover:bg-[#F9FBFA] cursor-pointer"
                  onClick={() => nav(`/materials/inventory/${item.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-[#394546] truncate">
                        {item.name}
                      </div>

                      <div className="text-[11px] text-[#8A9697] mt-0.5">
                        {item.id} · {item.category}
                      </div>
                    </div>

                    <span className="shrink-0 px-2 py-1 rounded-md bg-[#FBEAEA] text-[#9B3D3D] text-[10px] font-bold">
                      LOW
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-[#697677]">
                      {item.current} / {item.minimum} {item.unit}
                    </span>

                    <span className="text-[#8A9697]">{item.warehouse}</span>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-[#EEF1F0] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#B56A5E]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {!filteredLowStock.length && (
              <div className="py-8 text-center text-[12px] text-[#8A9697]">
                No materials match your search.
              </div>
            )}
          </div>
        </Card>

        {/* ====================================================
            MATERIAL REQUESTS
        ==================================================== */}

        <Card className="p-4">
          <SectionHeader
            title="Material Requests"
            subtitle={`${MOCK_STATS.pendingRequests} requests awaiting action`}
            action={
              <button
                onClick={() => nav("/materials/requests")}
                className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
              >
                View requests
                <ArrowRight size={13} />
              </button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#E8EDEB]">
                  <th className="text-left py-2 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Request
                  </th>

                  <th className="text-left py-2 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Project
                  </th>

                  <th className="text-center py-2 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Priority
                  </th>

                  <th className="text-center py-2 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {MOCK_REQUESTS.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-[#EEF2F0] last:border-0 hover:bg-[#F8FAF9] cursor-pointer"
                    onClick={() => nav(`/materials/requests/${request.id}`)}
                  >
                    <td className="py-3">
                      <div className="font-semibold text-[#394546]">
                        {request.id}
                      </div>

                      <div className="text-[10px] text-[#8A9697] mt-0.5">
                        {request.items} items · {request.date}
                      </div>
                    </td>

                    <td className="py-3 text-[#697677] max-w-[150px]">
                      <span className="truncate block">{request.project}</span>
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-[9px] font-bold ${getPriorityClass(
                          request.priority,
                        )}`}
                      >
                        {request.priority}
                      </span>
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-[9px] font-bold ${getRequestStatusClass(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ======================================================
          PURCHASE ORDERS + MOVEMENTS
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* ====================================================
            PURCHASE ORDERS
        ==================================================== */}

        <Card className="xl:col-span-2 p-4">
          <SectionHeader
            title="Purchase Orders"
            subtitle="Latest material procurement activity"
            action={
              <button
                onClick={() => nav("/materials/purchase-orders")}
                className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
              >
                View all
                <ArrowRight size={13} />
              </button>
            }
          />

          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#E8EDEB]">
                  <th className="text-left py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    PO
                  </th>

                  <th className="text-left py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Vendor
                  </th>

                  <th className="text-left py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Project
                  </th>

                  <th className="text-right py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Amount
                  </th>

                  <th className="text-center py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#7A8788]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {MOCK_PURCHASE_ORDERS.map((po) => (
                  <tr
                    key={po.id}
                    className="border-b border-[#EEF2F0] last:border-0 hover:bg-[#F8FAF9] cursor-pointer"
                    onClick={() => nav(`/materials/purchase-orders/${po.id}`)}
                  >
                    <td className="py-3">
                      <div className="font-semibold text-[#394546]">
                        {po.id}
                      </div>

                      <div className="text-[10px] text-[#8A9697] mt-0.5">
                        {po.items} items
                      </div>
                    </td>

                    <td className="py-3 text-[#697677]">{po.vendor}</td>

                    <td className="py-3 text-[#697677] max-w-[150px]">
                      <span className="truncate block">{po.project}</span>
                    </td>

                    <td className="py-3 text-right font-semibold text-[#394546]">
                      {formatCurrency(po.amount)}
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-md text-[9px] font-bold ${getPOStatusClass(
                          po.status,
                        )}`}
                      >
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ====================================================
            WAREHOUSE SUMMARY
        ==================================================== */}

        <Card className="p-4">
          <SectionHeader
            title="Warehouse Overview"
            subtitle="Current stock distribution"
          />

          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#F5F8F6]">
              <div className="flex items-center gap-2">
                <Warehouse size={15} className="text-[#1F453B]" />

                <span className="text-[12px] font-semibold text-[#394546]">
                  Main Warehouse
                </span>
              </div>

              <div className="mt-2 text-[20px] font-bold text-[#394546]">
                12,482
              </div>

              <div className="text-[11px] text-[#8A9697]">
                units · ₹2.86 Cr value
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#F5F8F6]">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-[#1F453B]" />

                <span className="text-[12px] font-semibold text-[#394546]">
                  Site Stores
                </span>
              </div>

              <div className="mt-2 text-[20px] font-bold text-[#394546]">
                6,160
              </div>

              <div className="text-[11px] text-[#8A9697]">
                units · ₹1.39 Cr value
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#E8EDEB]">
              <span className="text-[11px] text-[#8A9697]">
                Warehouse utilization
              </span>

              <span className="text-[12px] font-bold text-[#1F453B]">76%</span>
            </div>

            <div className="h-2 rounded-full bg-[#E8EDEB] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1F453B]"
                style={{ width: "76%" }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ======================================================
          MATERIAL MOVEMENTS
      ====================================================== */}

      <Card className="p-4 mb-6">
        <SectionHeader
          title="Today's Material Movement"
          subtitle="Latest inward and outward transactions"
          action={
            <div className="flex items-center gap-1 bg-[#F4F6F7] p-1 rounded-lg">
              {["ALL", "INWARD", "OUTWARD"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setMovementFilter(filter)}
                  className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold ${
                    movementFilter === filter
                      ? "bg-white text-[#1F453B] shadow-sm"
                      : "text-[#7A8788]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
          {filteredMovements.map((movement) => (
            <div
              key={movement.id}
              className="p-3 rounded-lg border border-[#E8EDEB] hover:bg-[#F8FAF9] cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    movement.type === "INWARD" ? "bg-[#E8F3EE]" : "bg-[#EAF1F8]"
                  }`}
                >
                  {movement.type === "INWARD" ? (
                    <ArrowDownToLine size={13} className="text-[#276749]" />
                  ) : (
                    <ArrowUpFromLine size={13} className="text-[#315A7D]" />
                  )}
                </div>

                <span className="text-[10px] text-[#8A9697]">
                  {movement.time}
                </span>
              </div>

              <div className="mt-2 text-[12px] font-semibold text-[#394546] truncate">
                {movement.material}
              </div>

              <div className="mt-1 text-[11px] text-[#8A9697]">
                {movement.quantity} {movement.unit}
              </div>

              <div className="mt-2 text-[10px] text-[#697677] truncate">
                {movement.location}
              </div>

              <div className="mt-1 text-[10px] text-[#A0AAAA]">
                {movement.reference}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ======================================================
          RECENT ACTIVITY + DEADLINES
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* ====================================================
            RECENT ACTIVITY
        ==================================================== */}

        <Card className="p-4">
          <SectionHeader
            title="Recent Activity"
            subtitle="Latest material operations"
            action={
              <button className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1">
                View activity
                <ArrowRight size={13} />
              </button>
            }
          />

          <div className="space-y-1">
            {MOCK_ACTIVITY.map((activity) => {
              let Icon = ClipboardList;

              if (activity.type === "INWARD") {
                Icon = ArrowDownToLine;
              } else if (activity.type === "OUTWARD") {
                Icon = ArrowUpFromLine;
              } else if (activity.type === "PO") {
                Icon = ShoppingCart;
              } else if (activity.type === "ALERT") {
                Icon = AlertTriangle;
              }

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#F8FAF9]"
                >
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-[#EEF3F0] flex items-center justify-center">
                    <Icon size={14} className="text-[#1F453B]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[12px] font-semibold text-[#394546]">
                        {activity.title}
                      </div>

                      <span className="text-[10px] text-[#9AA5A6] whitespace-nowrap">
                        {activity.time}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#7A8788] mt-0.5">
                      {activity.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ====================================================
            UPCOMING DEADLINES
        ==================================================== */}

        <Card className="p-4">
          <SectionHeader
            title="Upcoming Deadlines"
            subtitle="Material-related tasks requiring attention"
          />

          <div className="space-y-2">
            {MOCK_DEADLINES.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#E8EDEB] hover:bg-[#F8FAF9]"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    deadline.urgent ? "bg-[#FBEAEA]" : "bg-[#EEF3F0]"
                  }`}
                >
                  <Clock3
                    size={15}
                    className={
                      deadline.urgent ? "text-[#9B3D3D]" : "text-[#1F453B]"
                    }
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#394546]">
                    {deadline.title}
                  </div>

                  <div className="text-[11px] text-[#8A9697] mt-0.5">
                    {deadline.project}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-[11px] font-bold ${
                      deadline.urgent ? "text-[#9B3D3D]" : "text-[#526061]"
                    }`}
                  >
                    {deadline.date}
                  </div>

                  <div className="text-[10px] text-[#9AA5A6] mt-0.5">
                    {deadline.days}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ======================================================
          BOTTOM SUMMARY
      ====================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-6">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-[#1F453B]" />
            <span className="text-[12px] font-semibold text-[#667375]">
              Stock Turnover
            </span>
          </div>

          <div className="mt-2 text-[21px] font-bold text-[#394546]">4.8x</div>

          <div className="mt-1 text-[11px] text-[#8A9697]">
            Annualized inventory turnover
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[#276749]" />
            <span className="text-[12px] font-semibold text-[#667375]">
              Fill Rate
            </span>
          </div>

          <div className="mt-2 text-[21px] font-bold text-[#394546]">92.4%</div>

          <div className="mt-1 text-[11px] text-[#8A9697]">
            Requests fulfilled from available stock
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Truck size={15} className="text-[#315A7D]" />
            <span className="text-[12px] font-semibold text-[#667375]">
              On-Time Delivery
            </span>
          </div>

          <div className="mt-2 text-[21px] font-bold text-[#394546]">87.6%</div>

          <div className="mt-1 text-[11px] text-[#8A9697]">
            Vendor delivery performance
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <XCircle size={15} className="text-[#9B3D3D]" />
            <span className="text-[12px] font-semibold text-[#667375]">
              Out of Stock
            </span>
          </div>

          <div className="mt-2 text-[21px] font-bold text-[#394546]">
            {MOCK_STATS.outOfStock}
          </div>

          <div className="mt-1 text-[11px] text-[#8A9697]">
            Materials currently unavailable
          </div>
        </Card>
      </div>
    </Shell>
  );
}

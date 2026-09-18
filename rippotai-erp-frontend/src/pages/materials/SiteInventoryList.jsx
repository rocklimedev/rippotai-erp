import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  PackageOpen,
  ArrowRightLeft,
  Search,
  RefreshCw,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  ArrowLeftRight,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import {
  useGetProjectStockQuery,
  useGetInventorySummaryQuery,
} from "../../api/procuerment/inventory.api";

export default function SiteInventoryList() {
  const nav = useNavigate();

  const [q, setQ] = useState("");
  const [showActions, setShowActions] = useState(false);

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  const {
    data: stockData,
    isLoading,
    isFetching,
    refetch,
  } = useGetProjectStockQuery(
    projectFilter
      ? {
          projectId: projectFilter,
        }
      : undefined,
    {
      skip: !projectFilter,
    },
  );

  const { data: summaryData } = useGetInventorySummaryQuery(
    {
      projectId: projectFilter,
    },
    {
      skip: !projectFilter,
    },
  );

  /**
   * Backend may return:
   *
   * [
   *   {
   *     material: {...},
   *     unit: {...},
   *     quantity: 10
   *   }
   * ]
   *
   * Or:
   *
   * {
   *   data: [...]
   * }
   */
  const rows = useMemo(() => {
    if (Array.isArray(stockData)) return stockData;

    if (Array.isArray(stockData?.data)) {
      return stockData.data;
    }

    if (Array.isArray(stockData?.stock)) {
      return stockData.stock;
    }

    return [];
  }, [stockData]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      const materialName =
        r.material?.name ||
        r.material?.material_name ||
        r.materialName ||
        r.material_name ||
        "";

      const materialCode =
        r.material?.material_code ||
        r.material?.materialCode ||
        r.materialCode ||
        r.material_code ||
        "";

      const unit = r.unit?.name || r.unit?.code || r.unit || "";

      return (
        String(materialName).toLowerCase().includes(term) ||
        String(materialCode).toLowerCase().includes(term) ||
        String(unit).toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  const summary = {
    totalMaterials:
      summaryData?.totalMaterials ??
      summaryData?.total_materials ??
      rows.length,

    totalReceived:
      summaryData?.totalReceived ?? summaryData?.total_received ?? 0,

    totalIssued: summaryData?.totalIssued ?? summaryData?.total_issued ?? 0,

    lowStock: summaryData?.lowStock ?? summaryData?.low_stock ?? 0,

    zeroStock: summaryData?.zeroStock ?? summaryData?.zero_stock ?? 0,
  };

  const clearProjectFilter = () => {
    nav("/procurement/site-inventory");
  };

  const openTransactionPage = (type) => {
    const query = projectFilter
      ? `?project_id=${projectFilter}&type=${type}`
      : `?type=${type}`;

    nav(`/procurement/site-inventory/transactions/new${query}`);
  };

  return (
    <Shell
      title="Site Inventory"
      subtitle={`${rows.length} inventory item${
        rows.length !== 1 ? "s" : ""
      }${projectFilter ? " for this project" : ""}`}
      action={
        <div className="relative">
          <button
            onClick={() => setShowActions((v) => !v)}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-2"
          >
            <Plus size={15} />
            Inventory Action
          </button>

          {showActions && (
            <div className="absolute right-0 top-12 z-30 w-56 bg-white border border-[#D8E0DA] rounded-xl shadow-lg p-1.5">
              <ActionButton
                icon={PackagePlus}
                label="Receive Material"
                onClick={() => openTransactionPage("RECEIPT")}
              />

              <ActionButton
                icon={PackageMinus}
                label="Issue Material"
                onClick={() => openTransactionPage("ISSUE")}
              />

              <ActionButton
                icon={ArrowLeftRight}
                label="Transfer Material"
                onClick={() => openTransactionPage("TRANSFER")}
              />

              <ActionButton
                icon={SlidersHorizontal}
                label="Adjust Stock"
                onClick={() => openTransactionPage("ADJUSTMENT")}
              />

              <ActionButton
                icon={ArrowRightLeft}
                label="Return Material"
                onClick={() => openTransactionPage("RETURN")}
              />

              <ActionButton
                icon={PackageOpen}
                label="Opening Stock"
                onClick={() => openTransactionPage("OPENING")}
              />
            </div>
          )}
        </div>
      }
    >
      {/* ============================================================
          SUMMARY
      ============================================================ */}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Materials" value={summary.totalMaterials} />

        <SummaryCard
          label="Received"
          value={Number(summary.totalReceived).toLocaleString("en-IN")}
        />

        <SummaryCard
          label="Issued"
          value={Number(summary.totalIssued).toLocaleString("en-IN")}
        />

        <SummaryCard label="Low Stock" value={summary.lowStock} />

        <SummaryCard label="Zero Stock" value={summary.zeroStock} />
      </div>

      {/* ============================================================
          FILTER BAR
      ============================================================ */}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative max-w-sm w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9899]"
          />

          <Input
            placeholder="Search material or code…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        {projectFilter && (
          <button
            onClick={clearProjectFilter}
            className="text-[13px] text-[#333333] font-semibold"
          >
            Clear project filter ×
          </button>
        )}

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white inline-flex items-center gap-1.5 text-[13px] font-medium"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ============================================================
          TABLE
      ============================================================ */}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Material</th>
                <th className="text-left px-3 py-3">Code</th>
                <th className="text-left px-3 py-3">Unit</th>
                <th className="text-right px-3 py-3">Current Stock</th>
                <th className="text-left px-3 py-3">Stock Status</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r, index) => {
                  const materialName =
                    r.material?.name ||
                    r.material?.material_name ||
                    r.materialName ||
                    r.material_name ||
                    "Unnamed Material";

                  const materialCode =
                    r.material?.material_code ||
                    r.material?.materialCode ||
                    r.materialCode ||
                    r.material_code ||
                    "—";

                  const unit = r.unit?.name || r.unit?.code || r.unit || "—";

                  const stock = Number(
                    r.quantity ?? r.currentStock ?? r.current_stock ?? 0,
                  );

                  const materialId =
                    r.material?.id ||
                    r.material_id ||
                    r.materialId ||
                    r.id ||
                    index;

                  const status =
                    stock <= 0
                      ? "OUT OF STOCK"
                      : stock <= 5
                        ? "LOW STOCK"
                        : "IN STOCK";

                  return (
                    <tr
                      key={materialId}
                      onClick={() =>
                        nav(
                          `/procurement/site-inventory/${materialId}${
                            projectFilter ? `?project_id=${projectFilter}` : ""
                          }`,
                        )
                      }
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                    >
                      <td className="px-3 py-3 font-semibold">
                        <div className="flex items-center gap-2">
                          <PackageOpen size={15} className="text-[#B5C4B6]" />

                          {materialName}
                        </div>
                      </td>

                      <td className="px-3 py-3 text-[#6B7B7C]">
                        {materialCode}
                      </td>

                      <td className="px-3 py-3 text-[#6B7B7C]">{unit}</td>

                      <td className="px-3 py-3 text-right font-semibold">
                        {stock.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-3">
                        <StockStatus status={status} />
                      </td>

                      <td
                        className="px-3 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            nav(
                              `/procurement/site-inventory/${materialId}${
                                projectFilter
                                  ? `?project_id=${projectFilter}`
                                  : ""
                              }`,
                            )
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                          title="View inventory"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() =>
                            nav(
                              `/procurement/site-inventory/${materialId}/transactions${
                                projectFilter
                                  ? `?project_id=${projectFilter}`
                                  : ""
                              }`,
                            )
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                          title="Transactions"
                        >
                          <ArrowRightLeft size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {isFetching && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-10">
                    Loading site inventory...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-10">
                    No inventory items found.
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

/* ================================================================
   SMALL COMPONENTS
================================================================ */

function SummaryCard({ label, value }) {
  return (
    <Card>
      <div className="p-4">
        <div className="text-[12px] text-[#7B898A] uppercase tracking-wide">
          {label}
        </div>

        <div className="mt-1 text-[22px] font-bold text-[#1F453B]">{value}</div>
      </div>
    </Card>
  );
}

function StockStatus({ status }) {
  const classes =
    status === "OUT OF STOCK"
      ? "bg-[#FDECEC] text-[#A94442]"
      : status === "LOW STOCK"
        ? "bg-[#FFF5DD] text-[#8A681D]"
        : "bg-[#EAF3EE] text-[#1F453B]";

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-md text-[11px] font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2.5 rounded-lg flex items-center gap-2 text-left text-[13px] hover:bg-[#F4F6F7]"
    >
      <Icon size={15} className="text-[#1F453B]" />
      {label}
    </button>
  );
}

import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRightLeft,
  PackageMinus,
  PackagePlus,
  RotateCcw,
  SlidersHorizontal,
  ArrowLeftRight,
  History,
  RefreshCw,
} from "lucide-react";

import { Shell, Card } from "../../hooks/shared";

import {
  useGetMaterialStockQuery,
  useGetMaterialInventoryHistoryQuery,
} from "../../api/procuerment/inventory.api";

export default function SiteInventoryView() {
  const nav = useNavigate();
  const { id: materialId } = useParams();
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("project_id") || "";
  const siteId = searchParams.get("site_id") || "";

  const [showHistory, setShowHistory] = useState(false);

  const {
    data: stockData,
    isLoading,
    isFetching,
    refetch,
  } = useGetMaterialStockQuery(
    {
      projectId,
      materialId,
      siteId: siteId || undefined,
    },
    {
      skip: !projectId || !materialId,
    },
  );

  const { data: historyData } = useGetMaterialInventoryHistoryQuery(
    {
      projectId,
      materialId,
      siteId: siteId || undefined,
    },
    {
      skip: !projectId || !materialId || !showHistory,
    },
  );

  const stock = useMemo(() => {
    if (!stockData) {
      return {
        quantity: 0,
        material: null,
        unit: null,
      };
    }

    const source = stockData.data || stockData;

    return {
      quantity: Number(
        source.quantity ?? source.currentStock ?? source.current_stock ?? 0,
      ),

      material: source.material || source.materialMaster || null,

      unit: source.unit || source.material?.unit || null,
    };
  }, [stockData]);

  const materialName =
    stock.material?.name ||
    stock.material?.material_name ||
    stockData?.materialName ||
    stockData?.material_name ||
    "Material";

  const materialCode =
    stock.material?.material_code ||
    stock.material?.materialCode ||
    stockData?.materialCode ||
    stockData?.material_code ||
    "—";

  const unit =
    stock.unit?.name ||
    stock.unit?.code ||
    stockData?.unitName ||
    stockData?.unit ||
    "—";

  const quantity = stock.quantity;

  const history = Array.isArray(historyData)
    ? historyData
    : historyData?.data || historyData?.transactions || [];

  const openTransaction = (type) => {
    nav(
      `/procurement/site-inventory/transactions/new?project_id=${projectId}&material_id=${materialId}&type=${type}`,
    );
  };

  if (!projectId) {
    return (
      <Shell title="Material Inventory" subtitle="Project is required">
        <Card>
          <div className="p-8 text-center text-[#6B7B7C]">
            Please open inventory from a project.
          </div>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell
      title={materialName}
      subtitle={`Material Code: ${materialCode}`}
      action={
        <button
          onClick={() => nav(-1)}
          className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[13px] font-semibold inline-flex items-center gap-2"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      }
    >
      {/* ============================================================
          MATERIAL HEADER
      ============================================================ */}

      <Card>
        <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-[12px] uppercase tracking-wide text-[#8A9899]">
              Material
            </div>

            <h2 className="text-[22px] font-bold text-[#1F453B] mt-1">
              {materialName}
            </h2>

            <div className="text-[13px] text-[#6B7B7C] mt-1">
              {materialCode} · {unit}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <ActionButton
              icon={PackagePlus}
              label="Receive"
              onClick={() => openTransaction("RECEIPT")}
            />

            <ActionButton
              icon={PackageMinus}
              label="Issue"
              onClick={() => openTransaction("ISSUE")}
            />

            <ActionButton
              icon={RotateCcw}
              label="Return"
              onClick={() => openTransaction("RETURN")}
            />

            <ActionButton
              icon={SlidersHorizontal}
              label="Adjust"
              onClick={() => openTransaction("ADJUSTMENT")}
            />

            <ActionButton
              icon={ArrowLeftRight}
              label="Transfer"
              onClick={() => openTransaction("TRANSFER")}
            />
          </div>
        </div>
      </Card>

      {/* ============================================================
          STOCK CARDS
      ============================================================ */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StockCard
          label="Current Stock"
          value={quantity}
          unit={unit}
          loading={isLoading}
        />

        <StockCard
          label="Stock Status"
          value={
            quantity <= 0
              ? "OUT OF STOCK"
              : quantity <= 5
                ? "LOW STOCK"
                : "IN STOCK"
          }
          unit=""
          loading={isLoading}
          status
        />

        <StockCard
          label="Last Refresh"
          value={isFetching ? "Updating..." : "Up to date"}
          unit=""
          loading={false}
        />
      </div>

      {/* ============================================================
          ACTIONS
      ============================================================ */}

      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-[#1F453B]">Inventory</h3>

              <p className="text-[12px] text-[#7B898A] mt-1">
                Record stock movements for this material.
              </p>
            </div>

            <button
              onClick={() => refetch()}
              className="h-8 px-3 rounded-lg border border-[#D8E0DA] text-[12px] inline-flex items-center gap-1.5"
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <QuickAction
              icon={PackagePlus}
              label="Receive"
              onClick={() => openTransaction("RECEIPT")}
            />

            <QuickAction
              icon={PackageMinus}
              label="Issue"
              onClick={() => openTransaction("ISSUE")}
            />

            <QuickAction
              icon={RotateCcw}
              label="Return"
              onClick={() => openTransaction("RETURN")}
            />

            <QuickAction
              icon={ArrowLeftRight}
              label="Transfer"
              onClick={() => openTransaction("TRANSFER")}
            />

            <QuickAction
              icon={SlidersHorizontal}
              label="Adjustment"
              onClick={() => openTransaction("ADJUSTMENT")}
            />
          </div>
        </div>
      </Card>

      {/* ============================================================
          HISTORY
      ============================================================ */}

      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[#1F453B]">Recent Transactions</h3>

              <p className="text-[12px] text-[#7B898A] mt-1">
                Stock movement history for this material.
              </p>
            </div>

            <button
              onClick={() =>
                nav(
                  `/procurement/site-inventory/${materialId}/transactions?project_id=${projectId}`,
                )
              }
              className="text-[12px] font-semibold text-[#1F453B] inline-flex items-center gap-1"
            >
              <History size={14} />
              View all
            </button>
          </div>

          {!showHistory ? (
            <button
              onClick={() => setShowHistory(true)}
              className="text-[13px] font-semibold text-[#1F453B]"
            >
              Load transaction history →
            </button>
          ) : (
            <TransactionTable rows={history.slice(0, 10)} />
          )}
        </div>
      </Card>
    </Shell>
  );
}

function StockCard({ label, value, unit, loading, status }) {
  return (
    <Card>
      <div className="p-5">
        <div className="text-[12px] uppercase tracking-wide text-[#7B898A]">
          {label}
        </div>

        {loading ? (
          <div className="h-8 w-24 mt-2 rounded bg-[#EAEEF0] animate-pulse" />
        ) : (
          <div
            className={`mt-2 text-[24px] font-bold ${
              status
                ? value === "OUT OF STOCK"
                  ? "text-[#A94442]"
                  : value === "LOW STOCK"
                    ? "text-[#8A681D]"
                    : "text-[#1F453B]"
                : "text-[#1F453B]"
            }`}
          >
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}

            {unit && (
              <span className="text-[13px] ml-1 font-medium text-[#7B898A]">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-11 rounded-lg border border-[#D8E0DA] bg-white hover:bg-[#F4F6F7] text-[12px] font-semibold flex items-center justify-center gap-1.5"
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

function TransactionTable({ rows }) {
  if (!rows.length) {
    return (
      <div className="py-8 text-center text-[13px] text-[#8A9899]">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead className="bg-[#F4F6F7]">
          <tr>
            <th className="text-left px-3 py-2.5">Date</th>
            <th className="text-left px-3 py-2.5">Type</th>
            <th className="text-right px-3 py-2.5">Quantity</th>
            <th className="text-left px-3 py-2.5">Storage</th>
            <th className="text-left px-3 py-2.5">Remarks</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const direction =
              row.direction ||
              ([
                "RECEIPT",
                "RETURN_FROM_CONTRACTOR",
                "TRANSFER_IN",
                "ADJUSTMENT_IN",
              ].includes(row.transaction_type)
                ? "IN"
                : "OUT");

            const quantity = Number(row.quantity || 0);

            return (
              <tr
                key={row.id}
                className="border-t border-[rgba(31,69,59,0.08)]"
              >
                <td className="px-3 py-2.5">
                  {String(row.transaction_date || "").slice(0, 10) || "—"}
                </td>

                <td className="px-3 py-2.5">
                  <span className="font-semibold">
                    {String(row.transaction_type || "").replaceAll("_", " ")}
                  </span>
                </td>

                <td
                  className={`px-3 py-2.5 text-right font-semibold ${
                    direction === "IN" ? "text-[#1F453B]" : "text-[#A94442]"
                  }`}
                >
                  {direction === "IN" ? "+" : "-"}
                  {quantity.toLocaleString("en-IN")}
                </td>

                <td className="px-3 py-2.5 text-[#6B7B7C]">
                  {row.storage_location || "—"}
                </td>

                <td className="px-3 py-2.5 text-[#6B7B7C]">
                  {row.remarks || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

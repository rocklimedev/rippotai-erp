import React, { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Filter,
  RefreshCw,
  Plus,
  RotateCcw,
} from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetInventoryTransactionsQuery } from "../../api/procuerment/inventory.api";

export default function SiteInventoryTransactions() {
  const nav = useNavigate();
  const { id: materialId } = useParams();
  const [searchParams] = useSearchParams();

  const projectId = searchParams.get("project_id") || "";

  const siteId = searchParams.get("site_id") || "";

  const [transactionType, setTransactionType] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [q, setQ] = useState("");

  const { data, isLoading, isFetching, refetch } =
    useGetInventoryTransactionsQuery(
      {
        projectId,
        siteId: siteId || undefined,
        materialId,
        transactionType: transactionType || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      },
      {
        skip: !projectId || !materialId,
      },
    );

  const rows = useMemo(() => {
    if (Array.isArray(data)) return data;

    return data?.data || data?.transactions || [];
  }, [data]);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((row) => {
      const type = row.transaction_type || row.transactionType || "";

      const remarks = row.remarks || "";

      const reference = row.reference_id || "";

      return (
        String(type).toLowerCase().includes(term) ||
        String(remarks).toLowerCase().includes(term) ||
        String(reference).toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  const openTransaction = () => {
    nav(
      `/materials/site-inventory/transactions/new?project_id=${projectId}&material_id=${materialId}`,
    );
  };

  return (
    <Shell
      title="Inventory Transactions"
      subtitle={`${filteredRows.length} transaction${
        filteredRows.length !== 1 ? "s" : ""
      }`}
      action={
        <div className="flex gap-2">
          <button
            onClick={() => nav(-1)}
            className="h-9 px-3 rounded-lg border border-[#D8E0DA] bg-white text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            onClick={openTransaction}
            className="h-9 px-3 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            Record
          </button>
        </div>
      }
    >
      {/* FILTERS */}

      <Card>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={15} />
            <span className="text-[13px] font-semibold">Filters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Search transactions…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="h-10 rounded-lg border border-[#D8E0DA] bg-white px-3 text-[13px]"
            >
              <option value="">All transaction types</option>

              <option value="RECEIPT">Receipt</option>

              <option value="ISSUE">Issue</option>

              <option value="RETURN_FROM_CONTRACTOR">Contractor Return</option>

              <option value="RETURN_TO_VENDOR">Vendor Return</option>

              <option value="TRANSFER_IN">Transfer In</option>

              <option value="TRANSFER_OUT">Transfer Out</option>

              <option value="ADJUSTMENT_IN">Adjustment In</option>

              <option value="ADJUSTMENT_OUT">Adjustment Out</option>
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 rounded-lg border border-[#D8E0DA] bg-white px-3 text-[13px]"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 rounded-lg border border-[#D8E0DA] bg-white px-3 text-[13px]"
            />
          </div>
        </div>
      </Card>

      {/* TABLE */}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Date</th>

                <th className="text-left px-3 py-3">Type</th>

                <th className="text-right px-3 py-3">Quantity</th>

                <th className="text-left px-3 py-3">Direction</th>

                <th className="text-left px-3 py-3">Reference</th>

                <th className="text-left px-3 py-3">Storage</th>

                <th className="text-left px-3 py-3">Remarks</th>

                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((row) => {
                  const type =
                    row.transaction_type || row.transactionType || "";

                  const direction = row.direction || getDirection(type);

                  const quantity = Number(row.quantity || 0);

                  return (
                    <tr
                      key={row.id}
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7]"
                    >
                      <td className="px-3 py-3">
                        {String(
                          row.transaction_date || row.transactionDate || "",
                        ).slice(0, 10) || "—"}
                      </td>

                      <td className="px-3 py-3">
                        <span className="font-semibold">
                          {String(type).replaceAll("_", " ")}
                        </span>
                      </td>

                      <td
                        className={`px-3 py-3 text-right font-bold ${
                          direction === "IN"
                            ? "text-[#1F453B]"
                            : "text-[#A94442]"
                        }`}
                      >
                        {direction === "IN" ? "+" : "-"}
                        {quantity.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-3">
                        <DirectionBadge direction={direction} />
                      </td>

                      <td className="px-3 py-3 text-[#6B7B7C]">
                        {row.reference_type
                          ? String(row.reference_type).replaceAll("_", " ")
                          : "Manual"}
                      </td>

                      <td className="px-3 py-3 text-[#6B7B7C]">
                        {row.storage_location || "—"}
                      </td>

                      <td className="px-3 py-3 text-[#6B7B7C] max-w-xs truncate">
                        {row.remarks || "—"}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() =>
                            nav(
                              `/materials/site-inventory/transactions/${row.id}?project_id=${projectId}`,
                            )
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {isFetching && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8A9899]">
                    Loading transactions...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#8A9899]">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[#D8E0DA] flex justify-end">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 px-3 rounded-lg border border-[#D8E0DA] text-[12px] inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </Card>
    </Shell>
  );
}

function getDirection(type) {
  if (
    [
      "RECEIPT",
      "RETURN_FROM_CONTRACTOR",
      "TRANSFER_IN",
      "ADJUSTMENT_IN",
    ].includes(type)
  ) {
    return "IN";
  }

  return "OUT";
}

function DirectionBadge({ direction }) {
  return (
    <span
      className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${
        direction === "IN"
          ? "bg-[#EAF3EE] text-[#1F453B]"
          : "bg-[#FDECEC] text-[#A94442]"
      }`}
    >
      {direction}
    </span>
  );
}

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, FileText } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetMaterialQuotationsQuery } from "../../api/procurent.api";

export default function MaterialQuotationList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetMaterialQuotationsQuery();

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      return (
        (r.quotationNumber || r.quotation_number || "")
          .toLowerCase()
          .includes(term) || (r.status || "").toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  return (
    <Shell
      title="Material Quotations"
      subtitle={`${rows.length} quotation${rows.length !== 1 ? "s" : ""}`}
      action={
        <button
          onClick={() => nav("/materials/quotations/new")}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Quotation
        </button>
      }
    >
      <Input
        placeholder="Search quotations…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Quotation</th>
                <th className="text-left px-3 py-3">Date</th>
                <th className="text-left px-3 py-3">Total</th>
                <th className="text-left px-3 py-3">Status</th>
                <th className="text-left px-3 py-3">Accepted</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/materials/quotations/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <FileText size={14} className="text-[#B5C4B6]" />
                        {r.quotationNumber || r.quotation_number || "—"}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.quotationDate || r.quotation_date || "—"}
                    </td>

                    <td className="px-3 py-2.5 font-semibold">
                      ₹{Number(r.totalAmount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-xs font-semibold">
                        {r.status || "DRAFT"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.acceptedAt || r.accepted_at
                        ? (r.acceptedAt || r.accepted_at).slice(0, 10)
                        : "—"}
                    </td>

                    <td
                      className="px-3 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => nav(`/materials/quotations/${r.id}`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() =>
                          nav(`/materials/quotations/${r.id}/edit`)
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
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    Loading quotations...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    No quotations found.
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

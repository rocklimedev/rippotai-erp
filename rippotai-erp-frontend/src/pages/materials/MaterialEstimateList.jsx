import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, Calculator } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetMaterialEstimatesForRequirementQuery } from "../../api/procurent.api";

export default function MaterialEstimateList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const requirementId =
    new URLSearchParams(window.location.search).get(
      "material_requirement_id",
    ) || "";

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetMaterialEstimatesForRequirementQuery(requirementId, {
    skip: !requirementId,
  });

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      return (
        (r.unit || "").toLowerCase().includes(term) ||
        (r.approvalStatus || r.approval_status || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [rows, q]);

  return (
    <Shell
      title="Material Estimates"
      subtitle={`${rows.length} estimate${rows.length !== 1 ? "s" : ""}`}
      action={
        <button
          onClick={() =>
            nav(
              requirementId
                ? `/materials/estimates/new?material_requirement_id=${requirementId}`
                : "/materials/estimates/new",
            )
          }
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Estimate
        </button>
      }
    >
      <Input
        placeholder="Search estimates…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Quantity</th>
                <th className="text-left px-3 py-3">Unit</th>
                <th className="text-left px-3 py-3">Unit Rate</th>
                <th className="text-left px-3 py-3">Total</th>
                <th className="text-left px-3 py-3">Approval</th>
                <th className="text-left px-3 py-3">Quotation</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/materials/estimates/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5">{r.quantity ?? "—"}</td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.unit || "—"}
                    </td>

                    <td className="px-3 py-2.5">
                      ₹{Number(r.unitRate || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-2.5 font-semibold">
                      ₹{Number(r.totalAmount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-xs font-semibold">
                        {r.approvalStatus || r.approval_status || "PENDING"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5">
                      {r.convertedToQuotation || r.converted_to_quotation
                        ? "Created"
                        : "Not created"}
                    </td>

                    <td
                      className="px-3 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => nav(`/materials/estimates/${r.id}`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() => nav(`/materials/estimates/${r.id}/edit`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                      >
                        <Edit3 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

              {isFetching && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    Loading estimates...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    No estimates found.
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

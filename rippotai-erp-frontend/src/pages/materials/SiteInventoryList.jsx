import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, PackageOpen, ArrowRightLeft } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetSiteInventoryQuery } from "../../api/procurent.api";

export default function SiteInventoryList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetSiteInventoryQuery(projectFilter || undefined);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      return (
        (r.materialName || r.material_name || "")
          .toLowerCase()
          .includes(term) ||
        (r.materialRequirementId || r.material_requirement_id || "")
          .toLowerCase()
          .includes(term) ||
        (r.unit || "").toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  const clearProjectFilter = () => {
    nav("/materials/site-inventory");
  };

  return (
    <Shell
      title="Site Inventory"
      subtitle={`${rows.length} inventory item${
        rows.length !== 1 ? "s" : ""
      }${projectFilter ? " for this project" : ""}`}
      action={
        <button
          onClick={() =>
            nav(
              projectFilter
                ? `/materials/site-inventory/transactions/new?project_id=${projectFilter}`
                : "/materials/site-inventory/transactions/new",
            )
          }
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          Record Transaction
        </button>
      }
    >
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search inventory…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {projectFilter && (
          <button
            onClick={clearProjectFilter}
            className="text-[13px] text-[#333333] font-semibold"
          >
            Clear project filter ×
          </button>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3">Material</th>
                <th className="text-left px-3 py-3">Unit</th>
                <th className="text-left px-3 py-3">Current Stock</th>
                <th className="text-left px-3 py-3">Requirement</th>
                <th className="text-left px-3 py-3">Last Updated</th>
                <th className="text-right px-3 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/materials/site-inventory/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <PackageOpen size={14} className="text-[#B5C4B6]" />
                        {r.materialName ||
                          r.material_name ||
                          "Unnamed Material"}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.unit || "—"}
                    </td>

                    <td className="px-3 py-2.5 font-semibold">
                      {Number(
                        r.currentStock ?? r.current_stock ?? 0,
                      ).toLocaleString("en-IN")}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.materialRequirementId || r.material_requirement_id
                        ? "Linked"
                        : "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {(
                        r.lastUpdated ||
                        r.last_updated ||
                        r.updatedAt ||
                        r.updated_at ||
                        ""
                      ).slice(0, 10) || "—"}
                    </td>

                    <td
                      className="px-3 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => nav(`/materials/site-inventory/${r.id}`)}
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                        title="View inventory"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        onClick={() =>
                          nav(`/materials/site-inventory/${r.id}/transactions`)
                        }
                        className="p-1.5 rounded hover:bg-[#EAEEF0]"
                        title="Transactions"
                      >
                        <ArrowRightLeft size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

              {isFetching && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    Loading site inventory...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
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

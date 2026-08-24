import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, Package } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetMaterialRequirementsQuery } from "../../api/procurent.api";

export default function MaterialRequirementList() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const projectFilter =
    new URLSearchParams(window.location.search).get("project_id") || "";

  const {
    data: rows = [],
    isLoading,
    isFetching,
  } = useGetMaterialRequirementsQuery(projectFilter || undefined);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      const itemName = r.itemName || r.item_name || "";
      const category = r.category || "";
      const selection = r.selection || "";
      const style = r.style || "";
      const status = r.status || "";

      return (
        itemName.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        selection.toLowerCase().includes(term) ||
        style.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  const clearProjectFilter = () => {
    nav("/materials/requirements");
  };

  const handleCreate = () => {
    if (projectFilter) {
      nav(`/materials/requirements/new?project_id=${projectFilter}`);
    } else {
      nav("/materials/requirements/new");
    }
  };

  return (
    <Shell
      title="Material Requirements"
      subtitle={`${rows.length} requirement${
        rows.length !== 1 ? "s" : ""
      }${projectFilter ? " for this project" : " across the workspace"}`}
      action={
        <button
          onClick={handleCreate}
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Requirement
        </button>
      }
    >
      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search material requirements…"
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
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Material
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Category
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Selection
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Budget
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Updated
                </th>
                <th className="text-right px-3 py-3 w-[110px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!isLoading &&
                filteredRows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => nav(`/materials/requirements/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-semibold text-[#333333]">
                      <div className="flex items-center gap-1.5">
                        <Package size={14} className="text-[#B5C4B6]" />
                        {r.itemName || r.item_name || "Untitled"}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.category || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[280px]">
                      <span className="truncate block">
                        {r.selection || "—"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.budgetAmount != null
                        ? `₹${Number(r.budgetAmount).toLocaleString("en-IN")}`
                        : "—"}
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-[#333333] text-xs font-semibold">
                        {r.status || "DRAFT"}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {(
                        r.updatedAt ||
                        r.updated_at ||
                        r.createdAt ||
                        r.created_at ||
                        ""
                      ).slice(0, 10) || "—"}
                    </td>

                    <td
                      className="px-3 py-2.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => nav(`/materials/requirements/${r.id}`)}
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() =>
                            nav(`/materials/requirements/${r.id}/edit`)
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {isFetching && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    Loading material requirements...
                  </td>
                </tr>
              )}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    {q
                      ? "No material requirements match your search."
                      : "No material requirements yet."}
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

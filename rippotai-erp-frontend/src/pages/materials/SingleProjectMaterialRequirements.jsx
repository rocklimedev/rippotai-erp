import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Eye, Edit3, Package, ArrowLeft, RefreshCw } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetMaterialRequirementsByProjectQuery } from "../../api/procuerment/material-requirement.api";

export default function SingleProjectMaterialRequirements() {
  const nav = useNavigate();
  const { projectId } = useParams();

  const [q, setQ] = useState("");

  const {
    data: rows = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetMaterialRequirementsByProjectQuery(projectId, {
    skip: !projectId,
  });

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      const itemName = r.itemName || r.item_name || "";
      const category = r.category || "";
      const selection = r.selection || "";
      const style = r.style || "";
      const status = r.status || "";

      const materialName =
        r.material?.name ||
        r.material?.materialName ||
        r.material?.material_name ||
        "";

      return (
        itemName.toLowerCase().includes(term) ||
        category.toLowerCase().includes(term) ||
        selection.toLowerCase().includes(term) ||
        style.toLowerCase().includes(term) ||
        status.toLowerCase().includes(term) ||
        materialName.toLowerCase().includes(term)
      );
    });
  }, [rows, q]);

  const handleCreate = () => {
    nav(`/procurement/requirements/new?project_id=${projectId}`);
  };

  const handleView = (id) => {
    nav(`/procurement/requirements/${id}`);
  };

  const handleEdit = (id) => {
    nav(`/procurement/requirements/${id}/edit`);
  };

  return (
    <Shell
      title="Project Material Requirements"
      subtitle={`${rows.length} requirement${
        rows.length !== 1 ? "s" : ""
      } for this project`}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={() => nav(-1)}
            className="h-10 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] text-[14px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7]"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <button
            onClick={handleCreate}
            className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            New Requirement
          </button>
        </div>
      }
    >
      {/* ============================================================
          TOOLBAR
      ============================================================ */}

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="Search material requirements…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-10 px-3 rounded-lg border border-[rgba(31,69,59,0.14)] bg-white text-[#333333] text-[13px] font-semibold inline-flex items-center gap-1.5 hover:bg-[#F4F6F7] disabled:opacity-50"
          title="Refresh"
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
                filteredRows.map((r) => {
                  const itemName =
                    r.itemName ||
                    r.item_name ||
                    r.material?.name ||
                    r.material?.materialName ||
                    r.material?.material_name ||
                    "Untitled";

                  const category = r.category || "—";

                  const selection = r.selection || "—";

                  const budget =
                    r.budgetAmount != null
                      ? `₹${Number(r.budgetAmount).toLocaleString("en-IN")}`
                      : "—";

                  const status = r.status || "DRAFT";

                  const updated =
                    r.updatedAt ||
                    r.updated_at ||
                    r.createdAt ||
                    r.created_at ||
                    "";

                  return (
                    <tr
                      key={r.id}
                      onClick={() => handleView(r.id)}
                      className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                    >
                      {/* MATERIAL */}

                      <td className="px-3 py-2.5 font-semibold text-[#333333]">
                        <div className="flex items-center gap-1.5">
                          <Package size={14} className="text-[#B5C4B6]" />

                          {itemName}
                        </div>
                      </td>

                      {/* CATEGORY */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">{category}</td>

                      {/* SELECTION */}

                      <td className="px-3 py-2.5 text-[#6B7B7C] max-w-[280px]">
                        <span className="truncate block">{selection}</span>
                      </td>

                      {/* BUDGET */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">{budget}</td>

                      {/* STATUS */}

                      <td className="px-3 py-2.5">
                        <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-[#333333] text-xs font-semibold">
                          {status}
                        </span>
                      </td>

                      {/* UPDATED */}

                      <td className="px-3 py-2.5 text-[#6B7B7C]">
                        {updated.slice(0, 10) || "—"}
                      </td>

                      {/* ACTIONS */}

                      <td
                        className="px-3 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-0.5">
                          <button
                            onClick={() => handleView(r.id)}
                            className="p-1.5 rounded hover:bg-[#EAEEF0]"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            onClick={() => handleEdit(r.id)}
                            className="p-1.5 rounded hover:bg-[#EAEEF0]"
                            title="Edit"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {/* LOADING */}

              {isFetching && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    Loading material requirements...
                  </td>
                </tr>
              )}

              {/* EMPTY */}

              {!isFetching && !filteredRows.length && (
                <tr>
                  <td colSpan={7} className="text-center text-[#B5C4B6] py-8">
                    {q
                      ? "No material requirements match your search."
                      : "No material requirements have been added to this project yet."}
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

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit3, Images } from "lucide-react";

import { Shell, Card, Input } from "../../hooks/shared";

import { useGetSampleBoardsForRequirementQuery } from "../../api/procurent.api";
export default function SampleBoardList() {
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
  } = useGetSampleBoardsForRequirementQuery(requirementId, {
    skip: !requirementId,
  });

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();

    if (!term) return rows;

    return rows.filter((r) => {
      return (
        (r.title || "").toLowerCase().includes(term) ||
        (r.vendorName || r.vendor_name || "").toLowerCase().includes(term) ||
        (r.approvalStatus || r.approval_status || "")
          .toLowerCase()
          .includes(term)
      );
    });
  }, [rows, q]);

  return (
    <Shell
      title="Sample Boards"
      subtitle={`${rows.length} sample board${rows.length !== 1 ? "s" : ""}`}
      action={
        <button
          onClick={() =>
            nav(
              requirementId
                ? `/materials/sample-boards/new?material_requirement_id=${requirementId}`
                : "/materials/sample-boards/new",
            )
          }
          className="h-10 px-4 rounded-lg bg-[#1F453B] text-white text-[14px] font-semibold inline-flex items-center gap-1.5"
        >
          <Plus size={14} />
          New Sample Board
        </button>
      }
    >
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search sample boards…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />

        {!requirementId && (
          <div className="text-sm text-[#B05A3C] flex items-center">
            Select a material requirement to view sample boards.
          </div>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead className="bg-[#F4F6F7]">
              <tr>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Sample Board
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Vendor
                </th>
                <th className="text-left px-3 py-3 text-[13px] uppercase tracking-[0.14em] text-[#6B7B7C]">
                  Images
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
                    onClick={() => nav(`/materials/sample-boards/${r.id}`)}
                    className="border-t border-[rgba(31,69,59,0.08)] hover:bg-[#F4F6F7] cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Images size={14} className="text-[#B5C4B6]" />
                        {r.title || "Untitled Sample"}
                      </div>
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {r.vendorName || r.vendor_name || "—"}
                    </td>

                    <td className="px-3 py-2.5 text-[#6B7B7C]">
                      {Array.isArray(r.imageUrls) ? r.imageUrls.length : 0}
                    </td>

                    <td className="px-3 py-2.5">
                      <span className="px-2 py-1 rounded-md bg-[#F4F6F7] text-xs font-semibold">
                        {r.approvalStatus || r.approval_status || "PENDING"}
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
                      <div className="inline-flex">
                        <button
                          onClick={() =>
                            nav(`/materials/sample-boards/${r.id}`)
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() =>
                            nav(`/materials/sample-boards/${r.id}/edit`)
                          }
                          className="p-1.5 rounded hover:bg-[#EAEEF0]"
                        >
                          <Edit3 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {isFetching && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    Loading sample boards...
                  </td>
                </tr>
              )}

              {!isFetching && requirementId && !filteredRows.length && (
                <tr>
                  <td colSpan={6} className="text-center text-[#B5C4B6] py-8">
                    No sample boards found.
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

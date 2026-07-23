import React, { useState } from "react";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Search } from "lucide-react";

import LibraryItemModal from "../../components/boqs/LibraryItemModal";

import {
  useGetLibraryItemsQuery,
  useGetLibraryCategoriesQuery,
  useDeleteLibraryItemMutation,
  useUpdateLibraryItemMutation,
} from "../../api/boq.api";

/* ============ Rate & Item Library ============ */

export function BoqLibraryPage() {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const { data: items = [], refetch: refetchItems } = useGetLibraryItemsQuery(
    q ? { q } : undefined,
  );

  const { data: cats = [] } = useGetLibraryCategoriesQuery();

  const [deleteLibraryItem] = useDeleteLibraryItemMutation();

  const [updateLibraryItem] = useUpdateLibraryItemMutation();

  const del = async (it) => {
    if (!confirm(`Delete "${it.name}" from the library?`)) return;

    try {
      const { data } = await deleteLibraryItem(it.id).unwrap();

      toast.success(
        data?.referenced_by
          ? `Deleted (was used in ${data.referenced_by} BOQ line(s) — snapshots preserved)`
          : "Deleted",
      );

      refetchItems();
    } catch (err) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const move = async (it, category_id) => {
    if (!category_id || category_id === it.category_id) return;

    try {
      await updateLibraryItem({
        id: it.id,
        category_id,
        category_name: cats.find((c) => c.id === category_id)?.name,
      }).unwrap();

      toast.success("Moved");

      refetchItems();
    } catch (err) {
      toast.error(err?.data?.message || "Move failed");
    }
  };

  return (
    <div className="space-y-6" data-testid="library-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            BOQ · Management
          </div>

          <h1 className="text-[34px] font-bold text-[#333333]">
            Rate &amp; Item Library
          </h1>

          <p className="text-[13.5px] text-[#6B7B7C] mt-1">
            Central library used by templates and new BOQs. Edits here
            don&apos;t rewrite existing BOQ line-item snapshots.
          </p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-2"
          data-testid="library-add-btn"
        >
          <Plus size={15} />
          Add Item
        </button>
      </div>

      <div className="bc-card p-3 flex items-center gap-2">
        <Search size={14} className="text-[#B5C4B6] ml-2" />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search library items…"
          className="bc-input flex-1"
          data-testid="library-search"
        />
      </div>

      <div className="bc-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3">Item</th>

              <th className="px-3 py-3">Category</th>

              <th className="px-3 py-3">Unit</th>

              <th className="px-3 py-3 text-right">Default rate</th>

              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-[#6B7B7C]"
                >
                  No library items{q ? " for this search" : ""}.
                </td>
              </tr>
            )}

            {items.map((it) => (
              <tr
                key={it.id}
                className="border-b border-[#EAEEF0] hover:bg-[#FAF8F5]"
              >
                <td className="px-4 py-3 text-[13.5px] font-semibold">
                  {it.name}
                </td>

                <td className="px-3 py-3 text-[#6B7B7C]">
                  {it.category_name || "—"}
                </td>

                <td className="px-3 py-3">{it.unit}</td>

                <td className="px-3 py-3 text-right font-semibold">
                  <td className="px-3 py-3 text-right font-semibold">
                    {formatINR(it.default_rate || 0)}
                  </td>
                </td>

                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditing(it)}
                      className="flex items-center gap-1 text-[12.5px] font-semibold"
                    >
                      <Edit3 size={12} />
                      Edit
                    </button>

                    <select
                      onChange={(e) => move(it, e.target.value)}
                      value=""
                      className="h-7 px-1 text-[11.5px] border rounded"
                    >
                      <option value="">Move to…</option>

                      {cats
                        .filter((c) => c.id !== it.category_id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => del(it)}
                      className="flex items-center gap-1 text-[#7A2E1A]"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <LibraryItemModal
          item={editing}
          cats={cats}
          onClose={() => {
            setEditing(null);

            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);

            setCreating(false);

            refetchItems();
          }}
        />
      )}
    </div>
  );
}

export default BoqLibraryPage;

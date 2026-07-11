import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Plus, Bookmark } from "lucide-react";
import { relativeTime } from "@/lib/format";

export default function ShortlistsIndex() {
  const nav = useNavigate();
  const [lists, setLists] = useState(null);
  const [newName, setNewName] = useState("");

  const load = () =>
    api
      .get("/vendor-shortlists")
      .then((r) => setLists(r.data))
      .catch(() => setLists([]));
  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!newName.trim()) return;
    const { data } = await api.post("/vendor-shortlists", { name: newName });
    setNewName("");
    load();
    nav(`/vendors/shortlists/${data.id}`);
  };

  return (
    <div className="space-y-6" data-testid="shortlists-index">
      <button
        onClick={() => nav("/vendors")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
      >
        <ArrowLeft size={14} /> Back to Vendors
      </button>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6] mb-1.5">
            Vendors · Shortlists
          </div>
          <h1 className="text-[34px] font-bold text-[#333333]">
            Vendor Shortlists
          </h1>
          <p className="text-[13.5px] text-[#6B7B7C] mt-1">
            Curate short lists of vendors by project and work package.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="bc-input h-10 max-w-[280px]"
            placeholder="New shortlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            data-testid="new-list-name"
          />
          <button
            onClick={create}
            className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold flex items-center gap-1"
            data-testid="new-list-create"
          >
            <Plus size={14} /> Create
          </button>
        </div>
      </div>

      <section className="bc-card overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3">Name</th>
              <th className="px-3 py-3">Project</th>
              <th className="px-3 py-3">Work Package</th>
              <th className="px-3 py-3 text-right">Vendors</th>
              <th className="px-3 py-3">Created By</th>
              <th className="px-3 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {(lists || []).map((l) => (
              <tr
                key={l.id}
                onClick={() => nav(`/vendors/shortlists/${l.id}`)}
                className="border-b border-[#B5C4B6] hover:bg-[#EAEEF0] cursor-pointer"
                data-testid={`shortlist-row-${l.id}`}
              >
                <td className="px-4 py-3 font-semibold text-[#333333] flex items-center gap-2">
                  <Bookmark size={13} className="text-[#333333]" />
                  {l.name}
                </td>
                <td className="px-3 py-3 text-[#6B7B7C]">
                  {l.project_name || "—"}
                </td>
                <td className="px-3 py-3 text-[#6B7B7C]">
                  {l.work_package || "—"}
                </td>
                <td className="px-3 py-3 text-right font-semibold">
                  {l.vendor_count || 0}
                </td>
                <td className="px-3 py-3 text-[12px] text-[#6B7B7C]">
                  {l.created_by}
                </td>
                <td className="px-3 py-3 text-[11.5px] text-[#B5C4B6]">
                  {relativeTime(l.updated_at)}
                </td>
              </tr>
            ))}
            {lists && lists.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center text-[13px] text-[#6B7B7C]"
                >
                  No shortlists yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

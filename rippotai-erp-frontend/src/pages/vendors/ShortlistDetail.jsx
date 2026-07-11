import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/format";

export default function ShortlistDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sl, setSl] = useState(null);

  const load = () =>
    api.get(`/vendor-shortlists/${id}`).then((r) => setSl(r.data));
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [id]);

  if (!sl)
    return (
      <div className="p-10 text-center text-[13px] text-[#6B7B7C]">
        Loading…
      </div>
    );

  const remove = async (iid) => {
    await api.delete(`/vendor-shortlists/${id}/items/${iid}`);
    load();
    toast.success("Removed");
  };
  const move = async (idx, dir) => {
    const items = [...sl.items];
    const nidx = idx + dir;
    if (nidx < 0 || nidx >= items.length) return;
    [items[idx], items[nidx]] = [items[nidx], items[idx]];
    await api.post(`/vendor-shortlists/${id}/items/reorder`, {
      ordered_ids: items.map((i) => i.id),
    });
    load();
  };
  const setRemarks = async (iid, remarks) => {
    await api.patch(`/vendor-shortlists/${id}/items/${iid}`, {
      vendor_id: "_",
      internal_remarks: remarks,
    });
  };

  return (
    <div className="space-y-6" data-testid="shortlist-detail">
      <button
        onClick={() => nav("/vendors/shortlists")}
        className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
      >
        <ArrowLeft size={14} /> All Shortlists
      </button>
      <div>
        <div className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">
          Shortlist
        </div>
        <h1 className="text-[34px] font-bold text-[#333333]">{sl.name}</h1>
        <div className="text-[13px] text-[#6B7B7C] mt-1">
          {sl.project_name || "No project"} · {sl.work_package || "—"} ·{" "}
          {sl.items.length} vendors
        </div>
      </div>

      <section className="bc-card overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] bg-[#EAEEF0] border-b border-[#B5C4B6]">
              <th className="px-4 py-3 w-8">#</th>
              <th className="px-3 py-3">Vendor</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Location</th>
              <th className="px-3 py-3">Rating</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Availability</th>
              <th className="px-3 py-3">Remarks</th>
              <th className="px-3 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {sl.items.map((it, i) => {
              const v = it.vendor || {};
              return (
                <tr
                  key={it.id}
                  className="border-b border-[#B5C4B6] hover:bg-[#EAEEF0]"
                  data-testid={`sl-item-${it.id}`}
                >
                  <td className="px-4 py-3 text-[#333333] font-bold">
                    {i + 1}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={() => nav(`/vendors/${v.id}`)}
                      className="text-[#333333] font-semibold hover:text-[#333333]"
                    >
                      {v.name}
                    </button>
                    <div className="text-[11.5px] text-[#B5C4B6]">
                      {v.company}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[#6B7B7C]">
                    {v.primary_category}
                  </td>
                  <td className="px-3 py-3 text-[#6B7B7C]">
                    <MapPin size={11} className="inline mr-1 text-[#B5C4B6]" />
                    {v.city}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-0.5">
                      <Star
                        size={11}
                        className="text-[#333333] fill-[#1F453B]"
                      />
                      <span className="font-semibold">
                        {(v.rating || 0).toFixed(1)}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-3">{v.price_range}</td>
                  <td className="px-3 py-3 capitalize">
                    {v.availability_status?.replace("_", " ")}
                  </td>
                  <td className="px-3 py-3">
                    <input
                      className="bc-input h-8 py-0 text-[12px]"
                      defaultValue={it.internal_remarks}
                      onBlur={(e) => setRemarks(it.id, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(i, -1)}
                        className="p-1 rounded hover:bg-[#EAEEF0]"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        className="p-1 rounded hover:bg-[#EAEEF0]"
                      >
                        <ArrowDown size={13} />
                      </button>
                      <button
                        onClick={() => remove(it.id)}
                        className="p-1 rounded hover:bg-[#EAEEF0] text-[#333333]"
                        data-testid={`sl-remove-${it.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sl.items.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-10 text-center text-[13px] text-[#6B7B7C]"
                >
                  No vendors in this shortlist yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

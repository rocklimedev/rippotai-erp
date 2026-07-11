import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { relativeTime } from "@/lib/format";
import { ArrowLeft, Send, Bell } from "lucide-react";

export default function QuotationRequests() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []); // eslint-disable-line
  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get("/quotation-requests"); setRows(data); }
    catch { toast.error("Failed"); }
    setLoading(false);
  };
  const remind = async (rid) => {
    try { await api.post(`/quotation-requests/${rid}/remind`); toast.success("Reminder sent (stub)"); }
    catch { toast.error("Failed"); }
  };

  return (
    <div className="max-w-[1240px] mx-auto p-6">
      <button onClick={() => nav("/quotations")} className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"><ArrowLeft size={14} /> Estimates</button>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-[36px] font-bold text-[#333333]">Estimate Requests (RFQ)</h1>
          <p className="text-[13px] text-[#6B7B7C]">Track RFQs sent to vendors and their response status.</p>
        </div>
      </div>
      <div className="bg-white border border-[#B5C4B6] rounded-xl overflow-hidden">
        <table className="w-full text-[12.5px]">
          <thead className="text-[11px] uppercase text-[#B5C4B6]">
            <tr className="border-b border-[#B5C4B6]">
              <th className="text-left py-3 px-4">RFQ #</th>
              <th className="text-left py-3 px-4">Project</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Vendors</th>
              <th className="text-left py-3 px-4">Sent</th>
              <th className="text-left py-3 px-4">Deadline</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="py-8 text-center text-[#B5C4B6]">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-[#B5C4B6]">No RFQs yet.</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="border-b border-[#EAEEF0]" data-testid={`rfq-${r.id}`}>
                <td className="py-3 px-4 font-semibold text-[#333333]">{r.rfq_number}</td>
                <td className="py-3 px-4">{r.project_name || "—"}</td>
                <td className="py-3 px-4">{r.work_category}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {(r.vendors || []).map(v => {
                      const s = v.status;
                      const bg = s === "received" ? "#EAEEF0" : s === "declined" ? "#EAEEF0" : "#EAEEF0";
                      const fg = s === "received" ? "#1F453B" : s === "declined" ? "#1F453B" : "#1F453B";
                      return <span key={v.id} className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: bg, color: fg }}>{v.name} · {s}</span>;
                    })}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#6B7B7C]">{relativeTime(r.sent_at)}</td>
                <td className="py-3 px-4 text-[#6B7B7C]">{r.deadline?.slice(0, 10) || "—"}</td>
                <td className="py-3 px-4">
                  <button onClick={() => remind(r.id)} className="px-2.5 py-1 rounded-lg border border-[#B5C4B6] text-[11.5px] font-semibold inline-flex items-center gap-1" data-testid={`remind-${r.id}`}><Bell size={11} /> Remind</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

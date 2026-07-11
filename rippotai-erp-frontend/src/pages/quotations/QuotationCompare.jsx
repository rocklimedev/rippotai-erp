import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { fmtINR, StatusChip } from "@/lib/format";
import { ArrowLeft, Download, Save, Star, CheckCircle2 } from "lucide-react";

const ATTRIBUTES = [
  { k: "quotation_number", l: "Estimate #" },
  { k: "version", l: "Version" },
  { k: "status", l: "Status", isChip: true },
  { k: "quotation_date", l: "Date" },
  { k: "valid_until", l: "Valid Until" },
  { k: "currency", l: "Currency" },
];

const SUB = [
  { k: "base", l: "Base Total", money: true },
  { k: "tax", l: "Tax", money: true },
  { k: "transport", l: "Transportation", money: true },
  { k: "installation", l: "Installation", money: true },
];

const TERMS = [
  { k: "advance_pct", l: "Advance %" },
  { k: "credit_period_days", l: "Credit Period (days)" },
  { k: "warranty_months", l: "Warranty (months)" },
  { k: "delivery_timeline_days", l: "Delivery Timeline (days)" },
  { k: "completion_timeline_days", l: "Completion Timeline (days)" },
];

const METRICS = [
  { k: "rating", l: "Rating" },
  { k: "completed_projects", l: "Completed Projects" },
  { k: "on_time_pct", l: "On-Time %" },
  { k: "similar_projects_completed", l: "Similar Projects" },
  { k: "availability_status", l: "Availability" },
  { k: "current_assignments", l: "Current Load" },
];

export default function QuotationCompare() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const ids = (params.get("ids") || "").split(",").filter(Boolean);
  const [data, setData] = useState(null);
  const [saveModal, setSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [selectingId, setSelectingId] = useState(null);

  useEffect(() => {
    if (ids.length < 2) { toast.error("Need at least 2 quotations to compare"); nav("/quotations"); return; }
    api.get(`/quotations-compare?ids=${ids.join(",")}`).then(r => setData(r.data)).catch(() => toast.error("Failed"));
  }, [params]); // eslint-disable-line

  if (!data) return <div className="p-8 text-[#6B7B7C]">Loading comparison…</div>;

  const quotes = data.quotations;
  const lowestId = data.lowest_id;

  const saveComparison = async () => {
    if (!saveName.trim()) return;
    const q0 = quotes[0];
    await api.post("/quotation-comparisons", {
      name: saveName, project_id: q0.project_id, work_category: q0.work_category,
      quotation_ids: quotes.map(q => q.id),
    });
    toast.success("Comparison saved");
    setSaveModal(false);
  };

  const exportPdf = async () => {
    const res = await api.get(`/quotations-export-comparison-pdf?ids=${ids.join(",")}`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a"); a.href = url; a.download = "quotation_comparison.pdf"; a.click();
  };

  const doSelect = async (qid) => {
    setSelectingId(qid);
    try {
      await api.post(`/quotations/${qid}/mark-selected`, { remarks: "Selected via comparison" });
      toast.success("Estimate marked as selected");
      const r = await api.get(`/quotations-compare?ids=${ids.join(",")}`);
      setData(r.data);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
    setSelectingId(null);
  };

  return (
    <div className="max-w-[1728px] mx-auto p-6">
      <button onClick={() => nav("/quotations")} className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"><ArrowLeft size={14} /> Estimates</button>
      <div className="flex justify-between items-start flex-wrap gap-3 mb-5">
        <div>
          <h1 className="text-[36px] font-bold text-[#333333]">Comparison</h1>
          <p className="text-[13px] text-[#6B7B7C]">Comparing {quotes.length} quotations for {quotes[0]?.work_category} · {quotes[0]?.project_name}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPdf} className="px-3 py-2 rounded-lg border border-[#B5C4B6] text-[13px] font-semibold inline-flex items-center gap-1" data-testid="btn-export-comparison-pdf"><Download size={13} /> Export PDF</button>
          <button onClick={() => setSaveModal(true)} className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1" data-testid="btn-save-comparison"><Save size={13} /> Save Comparison</button>
        </div>
      </div>

      <div className="bg-white border border-[#B5C4B6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-[#B5C4B6] bg-[#EAEEF0]">
                <th className="text-left p-3 sticky left-0 bg-[#EAEEF0] w-[220px]">Attribute</th>
                {quotes.map(q => (
                  <th key={q.id} className={`text-left p-3 min-w-[220px] ${q.id === lowestId ? "bg-[#EAEEF0]" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-[#333333]">{q.vendor_name}</span>
                      {q.id === lowestId && <span className="text-[10px] font-bold text-white bg-[#1F453B] px-1.5 py-0.5 rounded" data-testid="lowest-badge">Lowest</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="text-[#333333] fill-[#1F453B]" />
                      <span className="text-[11px] font-semibold">{(q.vendor?.rating || 0).toFixed(1)}</span>
                      {q.vendor?.verified && <span className="text-[10px] text-[#333333] bg-[#EAEEF0] px-1 rounded">Verified</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTES.map(a => (
                <tr key={a.k} className="border-b border-[#EAEEF0]">
                  <td className="p-3 sticky left-0 bg-white text-[#B5C4B6] font-semibold">{a.l}</td>
                  {quotes.map(q => <td key={q.id} className={`p-3 ${q.id === lowestId ? "bg-[#EAEEF0]" : ""}`}>{a.isChip ? <StatusChip status={q[a.k]} /> : q[a.k]}</td>)}
                </tr>
              ))}
              {SUB.map(s => (
                <tr key={s.k} className="border-b border-[#EAEEF0]">
                  <td className="p-3 sticky left-0 bg-white text-[#B5C4B6] font-semibold">{s.l}</td>
                  {quotes.map(q => <td key={q.id} className={`p-3 ${q.id === lowestId ? "bg-[#EAEEF0]" : ""}`}>{s.money ? fmtINR(q.subtotals?.[s.k] || 0) : (q.subtotals?.[s.k] || "—")}</td>)}
                </tr>
              ))}
              {TERMS.map(t => (
                <tr key={t.k} className="border-b border-[#EAEEF0]">
                  <td className="p-3 sticky left-0 bg-white text-[#B5C4B6] font-semibold">{t.l}</td>
                  {quotes.map(q => <td key={q.id} className={`p-3 ${q.id === lowestId ? "bg-[#EAEEF0]" : ""}`}>{q.commercial_terms?.[t.k] ?? "—"}</td>)}
                </tr>
              ))}
              <tr className="border-t-2 border-[#1F453B] bg-[#EAEEF0]">
                <td className="p-3 sticky left-0 bg-[#EAEEF0] font-bold text-[#333333]">FINAL TOTAL</td>
                {quotes.map(q => (
                  <td key={q.id} className={`p-3 font-bold ${q.id === lowestId ? "text-[#333333]" : "text-[#333333]"}`}>
                    <div className="text-[18px]" data-testid={`total-${q.id}`}>{fmtINR(q.subtotals?.total || 0)}</div>
                    {q.id === lowestId && <div className="text-[11px] text-[#333333] font-semibold">Lowest total</div>}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[#EAEEF0]">
                <td className="p-3 sticky left-0 bg-white text-[#B5C4B6] font-semibold">BOQ Variation</td>
                {quotes.map(q => (
                  <td key={q.id} className="p-3">
                    <span className={`font-semibold ${q.boq_variation_pct == null ? "text-[#B5C4B6]" : q.boq_variation_pct > 10 ? "text-[#333333]" : q.boq_variation_pct > 0 ? "text-[#333333]" : "text-[#333333]"}`}>
                      {q.boq_variation_pct == null ? "—" : `${q.boq_variation_pct > 0 ? "+" : ""}${q.boq_variation_pct}%`}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="bg-[#EAEEF0]">
                <td className="p-3 sticky left-0 bg-[#EAEEF0] font-bold text-[#333333]">Vendor Metrics</td>
                {quotes.map(q => <td key={q.id} className="p-3"></td>)}
              </tr>
              {METRICS.map(m => (
                <tr key={m.k} className="border-b border-[#EAEEF0]">
                  <td className="p-3 sticky left-0 bg-white text-[#B5C4B6] font-semibold">{m.l}</td>
                  {quotes.map(q => <td key={q.id} className="p-3">{q.vendor_metrics?.[m.k] ?? "—"}</td>)}
                </tr>
              ))}
              <tr>
                <td className="p-3 sticky left-0 bg-white font-bold text-[#333333]">Action</td>
                {quotes.map(q => (
                  <td key={q.id} className="p-3">
                    {q.selected ? <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#333333]"><CheckCircle2 size={13} /> Selected</span> :
                      <button onClick={() => doSelect(q.id)} disabled={selectingId === q.id || q.status === "rejected"} className="px-3 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12px] font-semibold disabled:opacity-50" data-testid={`select-${q.id}`}>Select This</button>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Line item comparison */}
      {data.line_items?.length > 0 && (
        <div className="mt-6 bg-white border border-[#B5C4B6] rounded-xl p-5">
          <div className="text-[15px] font-bold text-[#333333] mb-3">Line Item Comparison</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-[#B5C4B6] text-[11px] uppercase text-[#B5C4B6]">
                  <th className="text-left py-2">Item</th>
                  <th className="text-left py-2">Unit</th>
                  <th className="text-right py-2">BOQ Rate</th>
                  {quotes.map(q => <th key={q.id} className="text-right py-2">{q.vendor_name} Rate</th>)}
                </tr>
              </thead>
              <tbody>
                {data.line_items.map((li, idx) => {
                  const rates = Object.entries(li.quotes || {}).map(([qid, q]) => ({ qid, rate: q?.rate || 0 }));
                  const min = Math.min(...rates.map(r => r.rate).filter(Boolean));
                  return (
                    <tr key={idx} className="border-b border-[#EAEEF0]">
                      <td className="py-2 pr-2">{li.description}</td>
                      <td className="py-2 pr-2">{li.unit}</td>
                      <td className="py-2 pr-2 text-right">{li.boq_rate ? fmtINR(li.boq_rate) : "—"}</td>
                      {quotes.map(q => {
                        const cell = li.quotes?.[q.id];
                        const isMin = cell?.rate === min && min > 0;
                        return <td key={q.id} className={`py-2 pr-2 text-right ${isMin ? "bg-[#EAEEF0] font-semibold text-[#333333]" : ""}`}>{cell ? fmtINR(cell.rate) : "—"}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {saveModal && (
        <div className="fixed inset-0 z-50 bg-[#1F453B]/40 flex items-center justify-center p-4" onClick={() => setSaveModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <div className="text-[15px] font-bold mb-3">Save Comparison</div>
            <input autoFocus value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="e.g. Kohli Flooring Comparison" className="w-full px-3 py-2 border border-[#B5C4B6] rounded-lg text-[13px] bg-[#EAEEF0]" data-testid="save-name-input" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setSaveModal(false)} className="px-3 py-1.5 rounded-lg border border-[#B5C4B6] text-[12.5px]">Cancel</button>
              <button onClick={saveComparison} className="px-4 py-1.5 rounded-lg bg-[#1F453B] text-white text-[12.5px] font-semibold" data-testid="btn-save-comparison-confirm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { formatINR, formatDate } from "@/lib/format";
import { ArrowLeft, Printer } from "lucide-react";

export default function BoqPreview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [boq, setBoq] = useState(null);

  useEffect(() => {
    api
      .get(`/boqs/${id}`)
      .then((r) => setBoq(r.data))
      .catch(() => {});
  }, [id]);

  if (!boq)
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7B7C]">
        Loading…
      </div>
    );

  return (
    <div className="min-h-screen bc-page-bg py-8">
      <div className="max-w-[820px] mx-auto px-6">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={() => nav(`/boq/${id}`)}
            className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to editor
          </button>
          <button
            onClick={() => window.print()}
            className="h-9 px-3 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold flex items-center gap-2"
          >
            <Printer size={14} /> Print
          </button>
        </div>

        <div className="bc-card p-10">
          <div className="text-[10.5px] uppercase tracking-widest text-[#333333] mb-1">
            Bill of Quantities · {boq.version} · {boq.status?.replace("_", " ")}
          </div>
          <h1 className="font-serif-bc text-[38px] leading-[1.05] text-[#333333]">
            {boq.project_name}
          </h1>
          <div className="text-[13px] text-[#6B7B7C] mt-1">{boq.location}</div>

          <div className="grid grid-cols-2 gap-6 mt-6 pb-6 border-b border-[#B5C4B6]">
            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Client
              </div>
              <div className="text-[13.5px] text-[#333333] mt-0.5">
                {boq.client_name || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Prepared By
              </div>
              <div className="text-[13.5px] text-[#333333] mt-0.5">
                {boq.prepared_by || "—"}
              </div>
            </div>
            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Date
              </div>
              <div className="text-[13.5px] text-[#333333] mt-0.5">
                {formatDate(boq.date)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Final Total
              </div>
              <div className="text-[32px] font-bold text-[#333333] mt-0.5">
                ₹{formatINR(boq.final_total || 0).replace("₹", "")}
              </div>
            </div>
          </div>

          {(boq.categories || []).map((c) => (
            <div key={c.id} className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif-bc text-[20px] text-[#333333]">
                  <span className="text-[#333333] mr-2">{c.code}</span>
                  {c.name}
                </h2>
                <div className="text-[13px] font-semibold text-[#333333]">
                  {formatINR(c.subtotal || 0)}
                </div>
              </div>
              <table className="w-full text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] border-b border-[#B5C4B6]">
                  <tr>
                    <th className="text-left py-2 w-8">#</th>
                    <th className="text-left py-2">Description</th>
                    <th className="text-left py-2 w-16">Unit</th>
                    <th className="text-right py-2 w-16">Qty</th>
                    <th className="text-right py-2 w-24">Rate</th>
                    <th className="text-right py-2 w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(boq.items || [])
                    .filter((i) => i.category_id === c.id)
                    .map((it, idx) => (
                      <tr key={it.id} className="border-b border-[#EAEEF0]">
                        <td className="py-2 text-[#B5C4B6]">{idx + 1}</td>
                        <td className="py-2 text-[#333333]">
                          {it.description}
                        </td>
                        <td className="py-2 text-[#6B7B7C]">{it.unit}</td>
                        <td className="py-2 text-right">
                          {it.calc_type === "L" ? "—" : it.quantity}
                        </td>
                        <td className="py-2 text-right">
                          {it.calc_type === "L" ? "Lump" : formatINR(it.rate)}
                        </td>
                        <td className="py-2 text-right font-semibold">
                          {formatINR(it.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="mt-8 pt-6 border-t border-[#B5C4B6]">
            <table className="ml-auto text-[13px]">
              <tbody>
                <tr>
                  <td className="pr-8 py-1 text-[#6B7B7C]">Project Total</td>
                  <td className="text-right font-semibold">
                    {formatINR(boq.project_total || 0)}
                  </td>
                </tr>
                <tr>
                  <td className="pr-8 py-1 text-[#6B7B7C]">
                    Miscellaneous ({boq.misc_pct || 10}%)
                  </td>
                  <td className="text-right font-semibold">
                    {formatINR(boq.misc_amount || 0)}
                  </td>
                </tr>
                <tr className="border-t border-[#B5C4B6]">
                  <td className="pr-8 py-2 font-bold text-[#333333] text-[15px]">
                    FINAL TOTAL
                  </td>
                  <td className="text-right font-bold text-[#333333] text-[18px]">
                    {formatINR(boq.final_total || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {boq.terms_html && (
            <div className="mt-10 pt-6 border-t border-[#B5C4B6]">
              <h3 className="font-serif-bc text-[18px] text-[#333333] mb-3">
                Terms & Conditions
              </h3>
              <div
                className="text-[12.5px] text-[#6B7B7C]"
                dangerouslySetInnerHTML={{ __html: boq.terms_html }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

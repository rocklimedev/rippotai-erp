import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";

import { useGetBoqByIdQuery } from "@/api/boq.api";
import { formatINR, formatDate } from "@/lib/format";

export default function BoqPreview() {
  const { id } = useParams();

  const nav = useNavigate();

  const { data: boq, isLoading } = useGetBoqByIdQuery(id);

  if (isLoading || !boq) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[#6B7B7C]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bc-page-bg py-8">
      <div className="max-w-[820px] mx-auto px-6">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={() => nav(`/boq/${id}`)}
            className="text-[13px] text-[#6B7B7C] hover:text-[#333333] flex items-center gap-1"
          >
            <ArrowLeft size={14} />
            Back to editor
          </button>

          <button
            onClick={() => window.print()}
            className="h-9 px-3 rounded-lg border border-[#B5C4B6] text-[12.5px] font-semibold flex items-center gap-2"
          >
            <Printer size={14} />
            Print
          </button>
        </div>

        <div className="bc-card p-10">
          <div className="text-[10.5px] uppercase tracking-widest text-[#333333] mb-1">
            Bill of Quantities · {boq.version} · {boq.status || "DRAFT"}
          </div>

          <h1 className="font-serif-bc text-[38px] leading-[1.05] text-[#333333]">
            {boq.project?.name || boq.title}
          </h1>

          <div className="text-[13px] text-[#6B7B7C] mt-1">
            {boq.project?.site_location || "—"}
          </div>

          <div className="grid grid-cols-2 gap-6 mt-6 pb-6 border-b border-[#B5C4B6]">
            <Info title="Client" value={boq.client_name} />

            <Info title="Prepared By" value={boq.prepared_by} />

            <Info title="Date" value={formatDate(boq.date)} />

            <div className="text-right">
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Final Total
              </div>

              <div className="text-[32px] font-bold text-[#333333]">
                {formatINR(boq.final_total || 0)}
              </div>
            </div>
          </div>

          {(boq.categories || []).map((category) => (
            <div key={category.id} className="mt-6">
              <div className="flex justify-between mb-3">
                <h2 className="font-serif-bc text-[20px] text-[#333333]">
                  {category.name}
                </h2>

                <div className="font-semibold">
                  {formatINR(category.subtotal || 0)}
                </div>
              </div>

              <table className="w-full text-[12.5px]">
                <thead className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] border-b">
                  <tr>
                    <th className="text-left py-2">#</th>

                    <th className="text-left">Description</th>

                    <th>Unit</th>

                    <th className="text-right">Qty</th>

                    <th className="text-right">Rate</th>

                    <th className="text-right">Amount</th>
                  </tr>
                </thead>

                <tbody>
                  {category.items?.map((item, index) => (
                    <tr key={item.id} className="border-b border-[#EAEEF0]">
                      <td className="py-2">{index + 1}</td>

                      <td>{item.notes || item.name || "—"}</td>

                      <td>{item.unit}</td>

                      <td className="text-right">{item.quantity}</td>

                      <td className="text-right">{formatINR(item.rate)}</td>

                      <td className="text-right font-semibold">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          <div className="mt-8 pt-6 border-t">
            <table className="ml-auto text-[13px]">
              <tbody>
                <tr>
                  <td className="pr-8">Project Total</td>

                  <td>{formatINR(boq.project_total)}</td>
                </tr>

                <tr>
                  <td>Miscellaneous ({boq.misc_pct}%)</td>

                  <td>{formatINR(boq.misc_amount)}</td>
                </tr>

                <tr className="font-bold text-lg">
                  <td>FINAL TOTAL</td>

                  <td>{formatINR(boq.final_total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {boq.terms_html && (
            <div
              className="mt-10 pt-6 border-t"
              dangerouslySetInnerHTML={{
                __html: boq.terms_html,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ title, value }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
        {title}
      </div>

      <div className="text-[13.5px] mt-1">{value || "—"}</div>
    </div>
  );
}

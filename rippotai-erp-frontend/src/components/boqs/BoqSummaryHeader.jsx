import React from "react";
import { Lock } from "lucide-react";
import { formatINR, formatDate } from "@/lib/format";
import { StatusChip } from "./StatusIndicators";

export function BoqSummaryHeader({ boq, disabled }) {
  const projectName = boq.project?.name || boq.title || "Untitled BOQ";

  const clientName =
    boq.client_name ||
    boq.project?.client?.name ||
    "—";

  const location =
    boq.location ||
    boq.project?.site_location ||
    "—";

  const total =
    boq.final_total ??
    boq.total_value ??
    0;

  const projectTotal =
    boq.project_total ??
    0;

  const miscAmount =
    boq.misc_amount ??
    0;

  return (
    <section
      className="bc-card p-6 md:p-8"
      data-testid="boq-summary-header"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1px_360px] gap-6 md:gap-8">

        {/* LEFT SECTION */}
        <div>

          <div className="flex items-center gap-2 mb-2">

            <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
              Bill of Quantities
            </div>

            <StatusChip status={boq.status} />

            <span
              className="text-[11px] font-mono font-bold text-[#333333] bg-[#EAEEF0] px-2 py-0.5 rounded"
              data-testid="boq-number"
            >
              {boq.boq_number || `BOQ-V${boq.version}`}
            </span>

            {disabled && (
              <span className="text-[11px] text-[#333333] flex items-center gap-1">
                <Lock size={11} />
                Locked
              </span>
            )}

          </div>


          <h1 className="font-serif-bc text-[34px] md:text-[42px] leading-[1.05] text-[#333333] tracking-tight">
            {projectName}
          </h1>


          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-5 text-[13px]">


            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Client
              </div>
              <div className="text-[#333333] mt-0.5">
                {clientName}
              </div>
            </div>


            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Location
              </div>
              <div className="text-[#333333] mt-0.5">
                {location}
              </div>
            </div>


            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Prepared By
              </div>
              <div className="text-[#333333] mt-0.5">
                {boq.prepared_by || "—"}
              </div>
            </div>


            <div>
              <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
                Date
              </div>
              <div className="text-[#333333] mt-0.5">
                {formatDate(boq.date || boq.created_at) || "—"}
              </div>
            </div>


          </div>

        </div>


        {/* DIVIDER */}
        <div className="hidden md:block bg-[#B5C4B6]" />


        {/* RIGHT SECTION */}
        <div className="md:pl-2">

          <div className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">
            Estimate Total
          </div>


          <div
            className="text-[36px] md:text-[44px] font-bold text-[#333333] tracking-tight mt-1"
            data-testid="boq-final-total"
          >
            {formatINR(total)}
          </div>


          <div className="text-[11.5px] text-[#6B7B7C] mt-1">
            Project Total {formatINR(projectTotal)}
            {" · "}
            Miscellaneous {boq.misc_pct || 10}%
            {" "}
            {formatINR(miscAmount)}
          </div>


        </div>


      </div>
    </section>
  );
}
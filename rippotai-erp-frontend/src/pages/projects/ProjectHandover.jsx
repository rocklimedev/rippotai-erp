import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Package, Send } from "lucide-react";

export default function ProjectHandover() {
  const { id } = useParams();
  const nav = useNavigate();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pkgResult, setPkgResult] = useState(null);
  const [deliverResult, setDeliverResult] = useState(null);

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line
  const load = async () => {
    try {
      const { data } = await api.get(`/projects/${id}/handover-package-status`);
      setStatus(data);
    } catch {
      toast.error("Failed");
    }
  };

  const prepare = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(
        `/projects/${id}/handover/prepare-package`,
      );
      setPkgResult(data);
      toast.success(`Package generated (${(data.size / 1024).toFixed(1)} KB)`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed");
    }
    setBusy(false);
  };

  const deliver = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/projects/${id}/handover/deliver`, {});
      setDeliverResult(data);
      toast.success("Delivery link created");
    } catch {
      toast.error("Failed");
    }
    setBusy(false);
  };

  if (!status) return <div className="p-8 text-[#6B7B7C]">Loading…</div>;

  return (
    <div className="max-w-[1000px] mx-auto p-6">
      <button
        onClick={() => nav(`/projects/${id}`)}
        className="text-[13px] text-[#6B7B7C] inline-flex items-center gap-1 mb-3"
      >
        <ArrowLeft size={14} /> Project
      </button>
      <h1 className="text-[36px] font-bold text-[#333333]">Handover Package</h1>
      <p className="text-[13px] text-[#6B7B7C] mt-1">
        Compile the final handover package for client delivery.
      </p>

      <div className="bg-white border border-[#B5C4B6] rounded-xl p-5 mt-5">
        <div className="flex justify-between items-center mb-4">
          <div className="text-[15px] font-bold text-[#333333]">
            Readiness: {status.percent}% ({status.available}/{status.required})
          </div>
          {status.ready && (
            <span className="text-[11px] font-bold text-[#333333] bg-[#EAEEF0] px-2 py-1 rounded-full">
              100% READY
            </span>
          )}
        </div>
        <div className="h-3 bg-[#EAEEF0] rounded-full mb-5 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${status.percent}%`,
              background: status.ready ? "#1F453B" : "#1F453B",
            }}
          />
        </div>
        <div className="space-y-2">
          {(status.checklist || []).map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-[13px]"
              data-testid={`checklist-${i}`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center ${c.done ? "bg-[#EAEEF0] text-[#333333]" : "bg-[#EAEEF0] text-[#B5C4B6]"}`}
              >
                {c.done ? "✓" : "○"}
              </div>
              <span className={c.done ? "text-[#333333]" : "text-[#6B7B7C]"}>
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick={prepare}
          disabled={busy || !status.ready}
          className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1 disabled:opacity-50"
          data-testid="btn-prepare-package"
        >
          <Package size={14} /> Prepare Handover Package
        </button>
        <button
          onClick={deliver}
          disabled={busy || !pkgResult}
          className="px-4 py-2 rounded-lg bg-[#1F453B] text-white text-[13px] font-semibold inline-flex items-center gap-1 disabled:opacity-50"
          data-testid="btn-deliver-client"
        >
          <Send size={14} /> Deliver to Client
        </button>
      </div>

      {pkgResult && (
        <div className="mt-4 bg-[#EAEEF0] border border-[#1F453B]/20 rounded-lg p-3 text-[12.5px] text-[#333333]">
          Package: <b>{pkgResult.filename}</b> (
          {(pkgResult.size / 1024).toFixed(1)} KB)
        </div>
      )}
      {deliverResult && (
        <div className="mt-3 bg-white border border-[#B5C4B6] rounded-lg p-3 text-[12.5px]">
          <div className="font-semibold text-[#333333]">Client Link:</div>
          <div className="text-[11px] text-[#6B7B7C] break-all mt-1">
            {deliverResult.url}
          </div>
          <a
            href={deliverResult.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block px-3 py-1 rounded bg-[#1F453B] text-white text-[11.5px]"
          >
            Open as Client
          </a>
        </div>
      )}
    </div>
  );
}

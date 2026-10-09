import React, { useState } from "react";
import { buildMonthlyMilestones } from "@/lib/monthly-milestones";

export default function MonthlyMilestoneBuilder({ totalShare = 0, contractValue = 0, existingCodes = [], canReplace = true, onGenerate }) {
  const [months, setMonths] = useState(12);
  const [firstDate, setFirstDate] = useState("");
  const [mode, setMode] = useState("append");
  const [share, setShare] = useState("");
  const [error, setError] = useState("");
  const allocation = share === "" ? (mode === "replace" ? 100 : Math.max(0, Math.round((100 - totalShare) * 100) / 100)) : Number(share);
  const generate = () => {
    try {
      if (mode === "replace" && !canReplace) throw new Error("Invoiced or paid milestones cannot be replaced.");
      if ((mode === "replace" ? 0 : totalShare) + allocation > 100.001) throw new Error("The combined milestone share cannot exceed 100%.");
      const rows = buildMonthlyMilestones({ firstDate, months, percentage: allocation, contractValue, existingCodes });
      onGenerate(rows, mode === "replace");
      setError("");
    } catch (e) { setError(e.message); }
  };
  return <details className="rounded-lg border p-4 bg-white">
    <summary className="cursor-pointer font-semibold text-sm">Add monthly payment milestones</summary>
    <p className="text-sm text-muted-foreground my-3">Split a share of the contract into monthly installments. Each payment has an editable due date. The final installment includes any rounding balance.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <label className="text-sm">First payment date<input aria-label="First monthly payment date" className="bc-input mt-1" type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} /></label>
      <label className="text-sm">Number of months<input aria-label="Number of monthly payments" className="bc-input mt-1" type="number" min="1" max="120" step="1" value={months} onChange={(e) => setMonths(e.target.value)} /></label>
      <label className="text-sm">Total share to split (%)<input aria-label="Monthly payment share" className="bc-input mt-1" type="number" min="0.01" max="100" step="0.01" value={allocation} onChange={(e) => setShare(e.target.value)} /></label>
      <label className="text-sm">Add to schedule<select aria-label="Monthly payment mode" className="bc-input mt-1" value={mode} onChange={(e) => { setMode(e.target.value); setShare(""); }}><option value="append">Keep existing milestones</option><option value="replace" disabled={!canReplace}>Replace draft milestones</option></select></label>
    </div>
    {mode === "replace" && <p className="text-sm mt-3">Generating will replace the current draft milestone rows.</p>}
    {error && <p role="alert" className="text-sm text-red-700 mt-3">{error}</p>}
    <button type="button" className="bc-btn-primary mt-3" onClick={generate}>Generate monthly milestones</button>
  </details>;
}

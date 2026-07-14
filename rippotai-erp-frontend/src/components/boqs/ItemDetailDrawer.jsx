import React, { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ItemDetailDrawer({ open, onClose, item, disabled, onPatch }) {
  const [detail, setDetail] = useState(item?.detail || {});
  const [notes, setNotes] = useState(item?.notes || "");
  useEffect(() => {
    setDetail(item?.detail || {});
    setNotes(item?.notes || "");
  }, [item]);
  if (!item) return null;

  const previewQty = () => {
    const d = detail;
    if (d.formula === "LxW")
      return `${d.length || 0} × ${d.width || 0} × ${d.repetitions || 1} = ${(d.length || 0) * (d.width || 0) * (d.repetitions || 1)}`;
    if (d.formula === "LxWxH")
      return `${d.length || 0} × ${d.width || 0} × ${d.height || 0} × ${d.repetitions || 1} = ${(d.length || 0) * (d.width || 0) * (d.height || 0) * (d.repetitions || 1)}`;
    if (d.formula === "CountxStd")
      return `${d.count || 0} × ${d.std_qty || 0} = ${(d.count || 0) * (d.std_qty || 0)}`;
    return "—";
  };
  const apply = () => {
    onPatch({ detail, notes });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] bg-white overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[11px] uppercase tracking-widest text-[#B5C4B6] font-normal">
            Item Detail
          </SheetTitle>
          <div className="text-[16px] font-bold text-[#333333]">{item.description}</div>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-[13px]">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">Calc Formula</label>
            <select
              className="bc-input mt-1"
              disabled={disabled}
              value={detail.formula || "Manual"}
              onChange={(e) => setDetail((d) => ({ ...d, formula: e.target.value }))}
            >
              <option value="Manual">Manual</option>
              <option value="LxW">Length × Width</option>
              <option value="LxWxH">Length × Width × Height</option>
              <option value="LxWxD">Length × Width × Depth</option>
              <option value="CountxStd">Count × Standard Qty</option>
              <option value="Running">Running Length</option>
              <option value="Lump">Lump</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["length", "width", "height", "depth", "repetitions", "count", "std_qty", "deduction", "wastage_pct"].map((k) => (
              <div key={k}>
                <label className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6]">{k.replace("_", " ")}</label>
                <input
                  type="number"
                  className="bc-input mt-1"
                  disabled={disabled}
                  value={detail[k] ?? ""}
                  onChange={(e) => setDetail((d) => ({ ...d, [k]: e.target.value === "" ? "" : Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-[#EAEEF0] border border-[#B5C4B6] text-[12px] text-[#6B7B7C]">
            <span className="text-[10.5px] uppercase tracking-widest text-[#B5C4B6] mr-2">Preview</span>
            {previewQty()}
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-[#B5C4B6]">Internal Notes</label>
            <textarea
              className="bc-input mt-1 min-h-[80px]"
              disabled={disabled}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          {!disabled && (
            <button
              onClick={apply}
              className="w-full h-10 rounded-xl bg-[#1F453B] hover:bg-[#1F453B] text-white font-semibold text-[13px]"
              data-testid="item-detail-apply"
            >
              Apply
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
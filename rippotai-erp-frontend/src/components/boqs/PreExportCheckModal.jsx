import React from "react";
import { FileText, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useGetBoqPdfThumbnailQuery } from "../../api/boq.api";

function PdfThumbPreview({ boqId, variant }) {
  const { data: src, isFetching, isError } = useGetBoqPdfThumbnailQuery(
    { boqId, variant },
    { skip: !variant },
  );
  return (
    <div
      className="border border-[rgba(31,69,59,0.14)] rounded-lg bg-white p-2 flex flex-col items-center justify-center min-h-[240px]"
      data-testid="pre-export-thumbnail"
    >
      {isError ? (
        <div className="text-[12px] text-[#B5C4B6] text-center px-3">
          <FileText size={26} className="mx-auto mb-2 text-[#B5C4B6]" />
          Preview unavailable
        </div>
      ) : src && !isFetching ? (
        <img src={src} alt="page 1 preview" style={{ width: 180, height: "auto" }} className="rounded shadow-sm" />
      ) : (
        <div className="text-[12px] text-[#6B7B7C]">
          <Loader2 size={13} className="inline animate-spin mr-1.5" /> Rendering preview…
        </div>
      )}
      <div className="text-[10.5px] text-[#B5C4B6] mt-2">Page 1 preview</div>
    </div>
  );
}

export function PreExportChecklistModal({ boqId, boq, variant, onClose, onConfirm }) {
  return (
    <Dialog open={!!variant} onOpenChange={(v) => !v && onClose()}>
      <DialogContent data-testid="pre-export-checklist-modal" className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle className="text-[#333333]">Pre-export checklist — {variant} variant</DialogTitle>
          <DialogDescription>
            Confirm before generating. Every category and every visible item is included.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[1fr_200px] gap-5">
          {(() => {
            const cats = boq?.categories || [];
            const items = boq?.items || [];
            const hidden = items.filter((i) => variant === "client" && i.hidden).length;
            const included = items.length - hidden;
            const ratesVisible = !(variant === "quantity_only" || variant === "vendor_enquiry");
            const rows = [
              ["Export type", variant],
              ["Categories in this BOQ", cats.length],
              ["Total items", items.length],
              ["Items included in this PDF", included],
              ["Items hidden from client copy", variant === "client" ? hidden : "n/a"],
              ["Rates shown", ratesVisible ? "Yes" : "No"],
              ["Terms & signatures", "Included"],
            ];
            return (
              <div className="grid gap-2 text-[13.5px]" data-testid="pre-export-checklist-body">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[rgba(31,69,59,0.08)] py-1.5">
                    <span className="text-[#6B7B7C]">{k}</span>
                    <span className="font-semibold text-[#333333]">{String(v)}</span>
                  </div>
                ))}
                <div className="text-[12px] text-[#6B7B7C] mt-2">
                  Editor order is preserved. Category headers repeat on every continuation page.
                </div>
              </div>
            );
          })()}
          <PdfThumbPreview boqId={boqId} variant={variant} />
        </div>
        <DialogFooter>
          <button onClick={onClose} className="h-10 px-4 rounded-xl border border-[#B5C4B6] text-[13px] font-semibold" data-testid="pre-export-cancel">
            Cancel
          </button>
          <button onClick={() => onConfirm(variant)} className="h-10 px-4 rounded-xl bg-[#1F453B] text-white text-[13px] font-semibold" data-testid="pre-export-confirm">
            Confirm & Download
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
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
import { useGetBoqPdfThumbnailQuery } from "../../api/boq/boq.api";
import { Button } from "@/components/inos";

const VARIANT_LABEL = { client: "Client", internal: "Internal", quantity_only: "Quantity only", vendor_enquiry: "Vendor enquiry" };
const variantLabel = (v) => VARIANT_LABEL[v] || String(v || "").replace(/_/g, " ");

function PdfThumbPreview({ boqId, variant }) {
  const {
    data: src,
    isFetching,
    isError,
  } = useGetBoqPdfThumbnailQuery({ boqId, variant }, { skip: !variant });
  return (
    <div
      className="cf-block"
      style={{ placeItems: "center", minHeight: 240, padding: 10 }}
      data-testid="pre-export-thumbnail"
    >
      {isError ? (
        <div className="inos-hint" style={{ textAlign: "center" }}>
          <FileText size={24} style={{ margin: "0 auto 8px", color: "var(--text-3)" }} aria-hidden />
          Preview unavailable
        </div>
      ) : src && !isFetching ? (
        <img
          src={src}
          alt="page 1 preview"
          style={{ width: 180, height: "auto", borderRadius: 6, boxShadow: "var(--shadow-sm)" }}
        />
      ) : (
        <div className="inos-hint">
          <Loader2 size={13} className="inline animate-spin mr-1.5" /> Rendering
          preview…
        </div>
      )}
      <div className="inos-hint">Page 1 preview</div>
    </div>
  );
}

export function PreExportChecklistModal({
  boqId,
  boq,
  variant,
  onClose,
  onConfirm,
  preview, // optional node: live page-1 preview (replaces the server thumbnail)
  busy,
}) {
  return (
    <Dialog open={!!variant} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-testid="pre-export-checklist-modal"
        className="sm:max-w-[820px]"
      >
        <DialogHeader>
          <DialogTitle>Before you export — {variantLabel(variant).toLowerCase()} PDF</DialogTitle>
          <DialogDescription>
            Check what goes into this PDF. Every category and visible item is
            included.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
          {(() => {
            const cats = boq?.categories || [];
            const items = boq?.items || [];
            const hidden = items.filter(
              (i) => variant === "client" && i.hidden,
            ).length;
            const included = items.length - hidden;
            const ratesVisible = !(
              variant === "quantity_only" || variant === "vendor_enquiry"
            );
            const rows = [
              ["Export type", variantLabel(variant)],
              ["Categories in this BOQ", cats.length],
              ["Total items", items.length],
              ["Items included in this PDF", included],
              [
                "Items hidden from client copy",
                variant === "client" ? hidden : "n/a",
              ],
              ["Rates shown", ratesVisible ? "Yes" : "No"],
              ["Terms & signatures", "Included"],
            ];
            return (
              <div
                className="cf-totals cf-totals--plain"
                data-testid="pre-export-checklist-body"
              >
                {rows.map(([k, v]) => (
                  <div key={k} className="cf-totals__row" style={{ borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>
                    <span>{k}</span>
                    <span>{String(v)}</span>
                  </div>
                ))}
                <div className="inos-hint" style={{ marginTop: 4 }}>
                  Editor order is preserved. Category headers repeat on every
                  continuation page.
                </div>
              </div>
            );
          })()}
          {preview ? (
            <div className="cf-block" style={{ placeItems: "center", minHeight: 240, padding: 10 }} data-testid="pre-export-thumbnail">
              {preview}
              <div className="inos-hint">Page 1 preview</div>
            </div>
          ) : (
            <PdfThumbPreview boqId={boqId} variant={variant} />
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} data-testid="pre-export-cancel">
            Cancel
          </Button>
          <Button variant="primary" loading={busy} onClick={() => onConfirm(variant)} data-testid="pre-export-confirm">
            Confirm & download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

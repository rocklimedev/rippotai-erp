// Turn a rendered <PrintDocument> into an A4 PDF (one image per .pd-page).
import { useCallback, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

/**
 * downloadDocumentPdf(rootEl, fileName, { title, author, subject, output })  — output: "blob" returns a Blob instead of saving
 * rootEl: the element passed as `ref` to <PrintDocument>.
 */
export async function downloadDocumentPdf(rootEl, fileName = "Document.pdf", { title, author = "Rippotai Architecture", subject, output } = {}) {
  if (!rootEl) throw new Error("downloadDocumentPdf: rootEl is required");
  rootEl.classList.add("is-capturing");
  try {
    await (document.fonts?.ready || Promise.resolve());
    // let images finish and the shadow-free style apply
    const imgs = Array.from(rootEl.querySelectorAll("img"));
    await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }))));
    await new Promise((r) => setTimeout(r, 200));

    const pageEls = Array.from(rootEl.querySelectorAll(".pd-page"));
    if (!pageEls.length) throw new Error("downloadDocumentPdf: no .pd-page elements found");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    for (let i = 0; i < pageEls.length; i++) {
      const canvas = await html2canvas(pageEls[i], {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }
    pdf.setProperties({ title: title || fileName.replace(/\.pdf$/i, ""), author, subject: subject || title || "", creator: "INOS" });
    // output: "blob" → return the PDF (e.g. to upload it) instead of saving it.
    if (output === "blob") return pdf.output("blob");
    pdf.save(fileName);
    return null;
  } finally {
    rootEl.classList.remove("is-capturing");
  }
}

/**
 * React helper: const { download, downloading } = usePdfDownload(ref);
 * download(fileName, { title, label }) shows loading/success/error toasts.
 */
export function usePdfDownload(ref) {
  const [downloading, setDownloading] = useState(false);
  const download = useCallback(
    async (fileName, { title, label = "document" } = {}) => {
      if (!ref?.current || downloading) return;
      const id = `pdf-${Date.now()}`;
      setDownloading(true);
      toast.loading(`Preparing the ${label}…`, { id });
      try {
        await downloadDocumentPdf(ref.current, fileName, { title });
        toast.success(`${label[0].toUpperCase()}${label.slice(1)} downloaded`, { id });
      } catch (e) {
        console.error("PDF generation failed:", e);
        toast.error("Couldn't create the PDF. Try again.", { id });
      } finally {
        setDownloading(false);
      }
    },
    [ref, downloading],
  );
  return { download, downloading };
}

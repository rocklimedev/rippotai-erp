// Proposal deck → PDF at the template's own page size (540 × 960 pt), one image per page.
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function downloadDeckPdf(rootEl, fileName = "Business-Proposal.pdf", { title } = {}) {
  const root = rootEl?.classList?.contains("bp-deck") ? rootEl : rootEl?.querySelector?.(".bp-deck");
  if (!root) throw new Error("The proposal is not ready.");
  root.classList.add("is-capturing");
  try {
    await (document.fonts?.ready || Promise.resolve());
    const imgs = Array.from(root.querySelectorAll("img"));
    await Promise.all(imgs.map((img) => (img.complete ? null : new Promise((r) => { img.onload = r; img.onerror = r; }))));
    const pages = Array.from(root.querySelectorAll(".bp-page"));
    const W = Number(root.dataset.pageWidth) || 540;
    const H = Number(root.dataset.pageHeight) || 960;
    const orientation = W > H ? "landscape" : "portrait";
    const pdf = new jsPDF({ unit: "pt", format: [W, H], orientation, compress: true });
    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await html2canvas(pages[i], { scale: 2.2, useCORS: true, backgroundColor: null, logging: false, scrollX: 0, scrollY: -window.scrollY });
      if (i) pdf.addPage([W, H], orientation);
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, W, H, undefined, "FAST");
    }
    pdf.setProperties({ title: title || fileName.replace(/\.pdf$/i, ""), author: "Rippotai Architecture", creator: "INOS" });
    pdf.save(fileName);
  } finally {
    root.classList.remove("is-capturing");
  }
}

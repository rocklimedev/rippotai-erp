// src/lib/pdf.js
// Requires: npm install jspdf html2canvas
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

/**
 * Renders every `.pdf-page` element found inside `containerEl` onto its own
 * A4 page of the output PDF, then triggers a download.
 */
export async function exportProposalToPdf(
  containerEl,
  fileName = "Rippotai-Business-Proposal.pdf",
) {
  if (!containerEl)
    throw new Error("exportProposalToPdf: containerEl is required");

  const pages = containerEl.querySelectorAll(".pdf-page");
  if (!pages.length)
    throw new Error("exportProposalToPdf: no .pdf-page elements found");

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // Fit the captured canvas to an A4 page, preserving aspect ratio.
    const ratio = Math.min(
      A4_WIDTH_PT / canvas.width,
      A4_HEIGHT_PT / canvas.height,
    );
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    const x = (A4_WIDTH_PT - w) / 2;
    const y = 0;

    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, "JPEG", x, y, w, h);
  }

  pdf.save(fileName);
}

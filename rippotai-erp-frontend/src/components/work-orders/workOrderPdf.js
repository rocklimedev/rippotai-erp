import html2canvas from "html2canvas";
import jsPDF from "jspdf";
export async function downloadWorkOrderPdf(element, orderNumber) {
  await document.fonts.ready;
  const pages = Array.from(element.querySelectorAll(".wo-page"));
  if (!pages.length) throw new Error("No work order pages are ready.");
  await Promise.all(
    Array.from(element.querySelectorAll(".wo-page img")).map((img) =>
      img.decode(),
    ),
  );
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  let outputPage = 0;
  for (const page of pages) {
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1280,
      onclone: (doc) => {
        doc.querySelectorAll(".wo-page").forEach((node) => {
          node.style.boxShadow = "none";
        });
        // Keep PDF ligatures from expanding under text-transform during capture.
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          node.textContent = node.textContent.replace(
            /[\uFB00-\uFB06]/g,
            (char) => char.normalize("NFKC"),
          );
        }
      },
    });
    // An exceptionally tall individual row may exceed A4; retain every pixel.
    const pagePixels = Math.round((canvas.width * 297) / 210);
    for (let top = 0; top < canvas.height; top += pagePixels) {
      if (outputPage++) pdf.addPage();
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = Math.min(pagePixels, canvas.height - top);
      slice
        .getContext("2d")
        .drawImage(
          canvas,
          0,
          top,
          canvas.width,
          slice.height,
          0,
          0,
          canvas.width,
          slice.height,
        );
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.98),
        "JPEG",
        0,
        0,
        210,
        (slice.height * 210) / canvas.width,
        undefined,
        "FAST",
      );
    }
  }
  const filename = String(orderNumber || "work-order")
    .replace(/[<>:"/\\|?*]+/g, "_")
    .trim();
  pdf.save(`${filename || "work-order"}.pdf`);
}

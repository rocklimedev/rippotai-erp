import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/** Render the same sheet, repeating headings and keeping complete rows on each page. */
export async function downloadPlannerPdf() {
  const source = document.querySelector(".planner-sheet");
  if (!source) throw new Error("Planner sheet is not available");
  await document.fonts.ready;
  const width = source.scrollWidth;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: width > 1500 ? "a3" : "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth() - 16;
  const pageHeight = pdf.internal.pageSize.getHeight() - 16;
  const maxHeight = (width * pageHeight) / pageWidth;
  const host = document.createElement("div");
  Object.assign(host.style, {
    position: "absolute",
    left: "-30000px",
    top: "0",
    width: `${width}px`,
    background: "#fff",
  });
  document.body.appendChild(host);
  const rows = [];
  let phase;
  for (const original of source.querySelectorAll("tbody tr")) {
    const row = original.cloneNode(true);
    const phaseCell = row.querySelector(".planner-phase");
    if (phaseCell) {
      phase = phaseCell.cloneNode(true);
      phase.removeAttribute("rowspan");
      phaseCell.replaceWith(phase.cloneNode(true));
    } else if (phase && source.dataset.sheet !== "Vendor & Procurement")
      row.children[0].after(phase.cloneNode(true));
    row.querySelectorAll("input,textarea,select").forEach((control) => {
      const text = document.createElement("span");
      text.textContent =
        control.tagName === "SELECT"
          ? control.selectedOptions[0]?.textContent || ""
          : control.value;
      control.replaceWith(text);
    });
    rows.push(row);
  }
  let pageCount = 0;
  const makePage = () => {
    host.replaceChildren();
    const sheet = source.cloneNode(false);
    sheet.style.width = `${width}px`;
    sheet.append(source.querySelector("header").cloneNode(true));
    const table = source.querySelector("table").cloneNode(false);
    table.append(
      source.querySelector("colgroup").cloneNode(true),
      source.querySelector("thead").cloneNode(true),
    );
    const body = document.createElement("tbody");
    table.append(body);
    sheet.append(table);
    host.append(sheet);
    return { sheet, body };
  };
  const renderPage = async (sheet) => {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: "#fff",
      useCORS: true,
      logging: false,
    });
    if (pageCount++) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.98),
      "JPEG",
      8,
      8,
      pageWidth,
      (canvas.height * pageWidth) / canvas.width,
    );
  };
  try {
    let page = makePage();
    for (const row of rows) {
      page.body.append(row);
      if (
        page.sheet.scrollHeight > maxHeight &&
        page.body.children.length > 1
      ) {
        row.remove();
        await renderPage(page.sheet);
        page = makePage();
        page.body.append(row);
      }
      if (page.sheet.scrollHeight > maxHeight)
        throw new Error(
          "A row is too tall for PDF. Download Excel to retain all content.",
        );
    }
    await renderPage(page.sheet);
    pdf.save(
      `project-planner-${source.dataset.sheet.toLowerCase().replaceAll(" ", "-")}.pdf`,
    );
  } finally {
    host.remove();
  }
}

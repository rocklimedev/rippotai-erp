import ExcelJS from "exceljs";

export const QUALITY_PHASES = [
  ["BEFORE_EXECUTION", "Before Execution"],
  ["DURING_EXECUTION", "During Execution"],
  ["AFTER_EXECUTION", "After Execution"],
];
export const QUALITY_STATUS_LABELS = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  DEFERRED: "Deferred",
};

function header(sheet, title, projectName, labels, widths) {
  sheet.columns = widths.map((width) => ({ width }));
  sheet.views = [{ state: "frozen", ySplit: 3, showGridLines: false }];
  sheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:3",
  };
  sheet.addRow([title]);
  sheet.mergeCells(1, 1, 1, labels.length);
  sheet.addRow([`Project: ${projectName}`]);
  sheet.mergeCells(2, 1, 2, labels.length);
  sheet.addRow(labels);
  sheet.getRow(1).font = { name: "Arial", size: 14, bold: true };
  sheet.getRow(1).height = 25;
  sheet.getRow(2).height = 22;
  sheet.getRow(3).height = 28;
  sheet.getRow(3).eachCell((cell) => {
    cell.font = {
      name: "Arial",
      size: 11,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF294B40" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
}
function body(row, text, width = 75) {
  row.height = Math.max(28, Math.ceil(String(text).length / width) * 16 + 12);
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: "Arial", size: 11 };
    cell.alignment = { vertical: "top", wrapText: true };
    cell.border = { bottom: { style: "hair", color: { argb: "FFDBE3DF" } } };
  });
}
function sheetName(workbook, requested) {
  const base =
    String(requested || "Checklist")
      .replace(/[\\/*?:[\]]/g, " ")
      .trim()
      .slice(0, 31) || "Checklist";
  let candidate = base;
  for (
    let index = 2;
    workbook.worksheets.some(
      (sheet) => sheet.name.toLowerCase() === candidate.toLowerCase(),
    );
    index++
  ) {
    const suffix = ` (${index})`;
    candidate = base.slice(0, 31 - suffix.length) + suffix;
  }
  return candidate;
}

// XLSX conversion happens in the browser using saved API JSON.
export function buildQualityWorkbook(data) {
  const workbook = new ExcelJS.Workbook();
  const projectName = data.project?.name || data.checklist?.project_id || "";
  if (data.work_heads) {
    const sheet = workbook.addWorksheet("QC -Work heads");
    header(
      sheet,
      "QUALITY CHECK LIST",
      projectName,
      ["S. no.", "Heads", "Status", "Remarks"],
      [10, 50, 18, 70],
    );
    [...data.work_heads]
      .sort(
        (a, b) =>
          (a.template_serial_number ?? a.sort_order) -
          (b.template_serial_number ?? b.sort_order),
      )
      .forEach((head) => {
        const row = sheet.addRow([
          head.template_serial_number ?? head.sort_order,
          head.name,
          head.status,
          head.remarks || null,
        ]);
        body(row, head.remarks || "");
      });
  }
  for (const { checklist, items = [] } of data.checklists || [data]) {
    if (!checklist) continue;
    const sheet = workbook.addWorksheet(
      sheetName(workbook, checklist.sheet_name || checklist.name),
    );
    header(
      sheet,
      checklist.title || checklist.name,
      projectName,
      [
        "S. No.",
        "Checkpoint",
        "Accepted (yes/no)",
        "Status",
        "Remarks/ Observation",
      ],
      [10, 85, 20, 18, 55],
    );
    for (const [phase, label] of QUALITY_PHASES) {
      const section = sheet.addRow([null, label]);
      sheet.mergeCells(section.number, 2, section.number, 5);
      section.height = 24;
      section.getCell(2).font = { name: "Arial", size: 11, bold: true };
      section.getCell(2).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE4ECE8" },
      };
      for (const item of items
        .filter((item) => item.phase === phase)
        .sort((a, b) => a.serial_number - b.serial_number)) {
        const row = sheet.addRow([
          item.serial_number,
          item.checkpoint_name,
          item.is_accepted === true
            ? "Yes"
            : item.is_accepted === false
              ? "No"
              : null,
          QUALITY_STATUS_LABELS[item.status] || item.status || null,
          item.remarks || null,
        ]);
        // Each wrapped column contributes independently to the required height.
        body(row, item.checkpoint_name);
        row.height = Math.max(
          row.height,
          Math.ceil(String(item.remarks || "").length / 48) * 16 + 12,
        );
        row.getCell(1).alignment = { horizontal: "center", vertical: "top" };
      }
    }
  }
  return workbook;
}

export async function downloadQualityWorkbook(data, filename) {
  const buffer = await buildQualityWorkbook(data).xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/[\\/:*?"<>|]/g, "_")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Project material requirements + sample boards → pages of the MATERIAL PALLETE TEMPLATE.
const has = (v) => v !== null && v !== undefined && String(v).trim() !== "";

/** Template sign-off conditions (verbatim). */
export const PALETTE_TERMS = [
  "Materials shown are subject to natural variation in shade, grain and veining; samples approved on site govern over screen or print colour.",
  "Quantities are estimates based on the current drawing set; final quantities are confirmed at site measurement before procurement.",
  "Prices are indicative as of the date of issue and are subject to change based on market rates at the time of order.",
  "Any change requested after sign-off is treated as a Variation, priced and timed separately, per the Payment Schedule.",
  "This sign-off does not replace the BOQ; final costing is governed by the BOQ once frozen.",
];

const fmtDate = (v) => {
  if (!has(v)) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const boardImages = (board) => {
  let v = board?.imageUrls ?? board?.image_urls ?? [];
  if (typeof v === "string") {
    try {
      v = JSON.parse(v);
    } catch {
      v = v ? [v] : [];
    }
  }
  return (Array.isArray(v) ? v : []).map((x) => (typeof x === "string" ? x : x?.url)).filter(has);
};

const STATUS = { APPROVED: "Approved", REJECTED: "Rejected", PENDING: "Pending approval" };

export function paletteModel({ project = {}, requirements = [], leadArchitect = "", madeBy = "" }) {
  const reqs = [...requirements].sort(
    (a, b) => String(a.category || "").localeCompare(String(b.category || "")) || String(a.itemName || "").localeCompare(String(b.itemName || "")),
  );
  const pages = [];
  reqs.forEach((r) => {
    const mat = r.material || {};
    const boards = (r.sampleBoards || r.sample_boards || []).length ? r.sampleBoards || r.sample_boards : [null];
    boards.forEach((b, bi) => {
      const imgs = boardImages(b);
      const status = b?.approvalStatus || b?.approval_status;
      pages.push({
        key: `${r.id}-${b?.id || bi}`,
        category: r.category || mat.category || "Materials",
        name: r.itemName || mat.name || b?.title || "Material",
        sub: b?.title && b.title !== r.itemName ? b.title : "",
        place: [r.selection, r.style].filter(has).join(" · ").toUpperCase(),
        image: imgs[0] || "",
        location: imgs[1] || "",
        rows: [
          ["BRAND", mat.brand || ""],
          ["CODE", mat.material_code || mat.code || ""],
          ["SQ.FT AREA", r.area || ""],
          ["QUANTITY", r.quantity || ""],
          ["PRICE", r.rate || ""],
          ["VENDOR", b?.vendorName || b?.vendor_name || ""],
          ["STATUS", [STATUS[status] || status, fmtDate(b?.approvedAt)].filter(has).join(" ")],
          ["NOTES", [b?.approvedBy ? `Approved by ${b.approvedBy}` : "", b?.notes, r.functionalNeeds].filter(has).join(" · ")],
        ],
      });
    });
  });

  // pages: 1 cover, 2 index, then materials; first page of a category carries its heading
  const sections = [];
  pages.forEach((p, i) => {
    p.page = i + 3;
    let sec = sections.find((s) => s.title === String(p.category).toUpperCase());
    if (!sec) {
      sec = { title: String(p.category).toUpperCase(), entries: [] };
      sections.push(sec);
      p.heading = sec.title;
    }
    sec.entries.push({ title: p.sub ? `${p.name} — ${p.sub}` : p.name, page: p.page });
  });

  const approved = pages.length && reqs.every((r) => (r.sampleBoards || []).some((b) => b?.approvalStatus === "APPROVED"));
  const lastApproval = reqs
    .flatMap((r) => r.sampleBoards || [])
    .filter((b) => b?.approvedAt)
    .sort((a, b) => new Date(b.approvedAt) - new Date(a.approvedAt))[0];

  return {
    projectName: project.name || "",
    date: fmtDate(new Date()),
    leadArchitect,
    madeBy,
    sections,
    pages,
    signoff: approved && lastApproval ? { name: lastApproval.approvedBy || "", date: fmtDate(lastApproval.approvedAt) } : { name: "", date: "" },
  };
}

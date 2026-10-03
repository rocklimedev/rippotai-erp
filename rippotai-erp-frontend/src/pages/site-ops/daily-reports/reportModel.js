// Daily site report — shared options, labels and form <-> API mapping.
// Used by the list, form, detail view and the PDF so all four stay in sync with
// backend DTO `CreateDailySiteReportDto` (src/modules/site-operations/dto/daily-report.dto.ts).
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Thermometer,
  CloudDrizzle,
  HelpCircle,
} from "lucide-react";

export const WEATHER = [
  { value: "CLEAR", label: "Clear", icon: Sun },
  { value: "CLOUDY", label: "Cloudy", icon: Cloud },
  { value: "RAIN", label: "Light rain", icon: CloudDrizzle },
  { value: "HEAVY_RAIN", label: "Heavy rain", icon: CloudRain },
  { value: "STORM", label: "Storm", icon: CloudLightning },
  { value: "EXTREME_HEAT", label: "Extreme heat", icon: Thermometer },
  { value: "OTHER", label: "Other", icon: HelpCircle },
];

export const SITE_CONDITIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "WET", label: "Wet" },
  { value: "WATERLOGGED", label: "Waterlogged" },
  { value: "DUSTY", label: "Dusty" },
  { value: "RESTRICTED", label: "Restricted access" },
  { value: "CLOSED", label: "Site closed" },
];

export const TRADES = [
  { value: "CIVIL", label: "Civil / masonry" },
  { value: "ELECTRICAL", label: "Electrical" },
  { value: "PLUMBING", label: "Plumbing" },
  { value: "HVAC", label: "HVAC" },
  { value: "CARPENTRY", label: "Carpentry" },
  { value: "FALSE_CEILING", label: "False ceiling" },
  { value: "FLOORING", label: "Flooring / tiling" },
  { value: "STONE", label: "Stone / marble" },
  { value: "PAINTING", label: "Painting / polish" },
  { value: "GLASS_ALUMINIUM", label: "Glass & aluminium" },
  { value: "METAL_FABRICATION", label: "Metal fabrication" },
  { value: "WATERPROOFING", label: "Waterproofing" },
  { value: "LANDSCAPING", label: "Landscaping" },
  { value: "HELPER", label: "Helpers / labour" },
  { value: "SUPERVISION", label: "Supervision" },
  { value: "OTHER", label: "Other" },
];

export const ISSUE_TYPES = [
  { value: "DELAY", label: "Delay" },
  { value: "MATERIAL", label: "Material" },
  { value: "MANPOWER", label: "Manpower" },
  { value: "DESIGN", label: "Design / drawing" },
  { value: "CLIENT", label: "Client decision" },
  { value: "WEATHER", label: "Weather" },
  { value: "QUALITY", label: "Quality" },
  { value: "SAFETY", label: "Safety" },
  { value: "OTHER", label: "Other" },
];

export const IMPACTS = [
  { value: "NONE", label: "None" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export const UNITS = ["NOS", "BAG", "SQFT", "SQM", "RFT", "RMT", "KG", "MT", "LTR", "CUM", "CFT", "BOX", "SET", "LS"];

const labelFrom = (list) => (v) => list.find((o) => o.value === v)?.label || (v ? String(v).replace(/_/g, " ").toLowerCase().replace(/^\w/, (m) => m.toUpperCase()) : "—");
export const weatherLabel = labelFrom(WEATHER);
export const siteConditionLabel = labelFrom(SITE_CONDITIONS);
export const tradeLabel = labelFrom(TRADES);
export const issueTypeLabel = labelFrom(ISSUE_TYPES);
export const impactLabel = labelFrom(IMPACTS);
export const weatherIcon = (v) => WEATHER.find((o) => o.value === v)?.icon || Sun;
export const impactTone = (v) => ({ HIGH: "bad", MEDIUM: "warn", LOW: "info", NONE: "mute" })[v] || "mute";

/** Local YYYY-MM-DD (not UTC — a report filed at 1am IST belongs to today). */
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const shiftISO = (iso, days) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};
export const fmtDate = (iso, opts = { day: "numeric", month: "short", year: "numeric" }) => {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", opts);
};
export const fmtWeekday = (iso) => fmtDate(iso, { weekday: "long" });

export const manpowerTotal = (report) =>
  (report?.manpower || []).reduce((s, m) => s + (Number(m.headcount) || 0), 0);
export const issueCount = (report) =>
  (report?.issueItems?.length || 0) + (!report?.issueItems?.length && report?.issues ? 1 : 0);
export const hasAttention = (report) =>
  !!report?.needsAttention || (report?.issueItems || []).some((i) => i.needsAttention);

let _k = 0;
export const rowKey = () => `r${Date.now().toString(36)}${(_k++).toString(36)}`;

export const blankManpower = () => ({ key: rowKey(), trade: "", contractorName: "", headcount: "" });
export const blankWork = () => ({ key: rowKey(), activity: "", location: "", progress: "" });
export const blankMaterial = (direction = "RECEIVED") => ({ key: rowKey(), direction, materialId: "", name: "", quantity: "", unit: "NOS", remarks: "" });
export const blankEquipment = () => ({ key: rowKey(), name: "", count: "", hours: "" });
export const blankIssue = () => ({ key: rowKey(), type: "DELAY", description: "", impact: "LOW", needsAttention: false });

export const emptyForm = ({ projectId = "", reportedBy = "" } = {}) => ({
  projectId,
  reportDate: todayISO(),
  weatherCondition: "CLEAR",
  weatherNotes: "",
  siteCondition: "NORMAL",
  manpower: [blankManpower()],
  workItems: [blankWork()],
  workCompleted: "",
  materials: [],
  equipment: [],
  issueItems: [],
  safetyIncident: false,
  safetyNotes: "",
  photos: [],
  nextDayPlan: "",
  reportedBy,
  shareWithClient: false,
});

/** API report -> form state. */
export const formFromReport = (r) => ({
  projectId: r.projectId,
  reportDate: String(r.reportDate).slice(0, 10),
  weatherCondition: r.weatherCondition || "",
  weatherNotes: r.weatherNotes || "",
  siteCondition: r.siteCondition || "",
  manpower: (r.manpower || []).map((m) => ({ key: rowKey(), trade: m.trade || "", contractorName: m.contractorName || "", headcount: m.headcount ?? "" })),
  workItems: (r.workItems || []).map((w) => ({ key: rowKey(), activity: w.activity || "", location: w.location || "", progress: w.progress ?? "" })),
  workCompleted: r.workCompleted || "",
  materials: (r.materials || []).map((m) => ({ key: rowKey(), direction: m.direction || "RECEIVED", materialId: m.materialId || "", name: m.name || "", quantity: m.quantity ?? "", unit: m.unit || "NOS", remarks: m.remarks || "" })),
  equipment: (r.equipment || []).map((e) => ({ key: rowKey(), name: e.name || "", count: e.count ?? "", hours: e.hours ?? "" })),
  issueItems: (r.issueItems || []).map((i) => ({ key: rowKey(), type: i.type || "OTHER", description: i.description || "", impact: i.impact || "LOW", needsAttention: !!i.needsAttention })),
  safetyIncident: !!r.safetyIncident,
  safetyNotes: r.safetyNotes || "",
  photos: (r.photos || []).map((p) => ({ key: rowKey(), url: p.url, caption: p.caption || "", filename: p.filename || "" })),
  nextDayPlan: r.nextDayPlan || "",
  reportedBy: r.reportedBy || "",
  shareWithClient: !!r.shareWithClient,
});

const str = (v) => (v == null ? "" : String(v).trim());
const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? undefined : Number(v));
const opt = (v) => str(v) || undefined;

/** Form state -> exact CreateDailySiteReportDto / UpdateDailySiteReportDto payload. Blank rows are dropped. */
export const payloadFromForm = (f, status, { includeProject = true } = {}) => {
  const body = {
    reportDate: f.reportDate,
    status,
    weatherCondition: f.weatherCondition || undefined,
    weatherNotes: str(f.weatherNotes),
    siteCondition: f.siteCondition || undefined,
    workCompleted: str(f.workCompleted),
    manpower: f.manpower
      .filter((m) => m.trade && num(m.headcount) != null)
      .map((m) => ({ trade: m.trade, contractorName: opt(m.contractorName), headcount: Math.round(num(m.headcount)) })),
    workItems: f.workItems
      .filter((w) => str(w.activity))
      .map((w) => ({ activity: str(w.activity), location: opt(w.location), progress: num(w.progress) != null ? Math.round(num(w.progress)) : undefined })),
    materials: f.materials
      .filter((m) => str(m.name) && num(m.quantity) != null)
      .map((m) => ({ direction: m.direction, materialId: m.materialId || undefined, name: str(m.name), quantity: num(m.quantity), unit: opt(m.unit), remarks: opt(m.remarks) })),
    equipment: f.equipment
      .filter((e) => str(e.name))
      .map((e) => ({ name: str(e.name), count: num(e.count) != null ? Math.round(num(e.count)) : undefined, hours: num(e.hours) })),
    issueItems: f.issueItems
      .filter((i) => str(i.description))
      .map((i) => ({ type: i.type, description: str(i.description), impact: i.impact || undefined, needsAttention: !!i.needsAttention })),
    safetyIncident: !!f.safetyIncident,
    safetyNotes: str(f.safetyNotes),
    photos: f.photos.filter((p) => p.url).map((p) => ({ url: p.url, caption: opt(p.caption), filename: opt(p.filename) })),
    nextDayPlan: str(f.nextDayPlan),
    reportedBy: str(f.reportedBy),
    shareWithClient: !!f.shareWithClient,
  };
  if (includeProject) body.projectId = f.projectId;
  return body;
};

/** Returns { field: message } — keys match form paths (e.g. "manpower.2.headcount"). */
export const validateForm = (f, status) => {
  const e = {};
  if (!f.projectId) e.projectId = "Pick the project this report is for";
  if (!f.reportDate) e.reportDate = "Report date is required";
  else if (f.reportDate > todayISO()) e.reportDate = "Report date can't be in the future";
  if (!str(f.reportedBy)) e.reportedBy = "Who is filing this report?";

  f.manpower.forEach((m, i) => {
    const blank = !m.trade && !str(m.contractorName) && str(m.headcount) === "";
    if (blank) return;
    if (!m.trade) e[`manpower.${i}.trade`] = "Pick a trade";
    const n = num(m.headcount);
    if (n == null || n < 0) e[`manpower.${i}.headcount`] = "Enter a headcount";
  });
  f.workItems.forEach((w, i) => {
    const p = num(w.progress);
    if (!str(w.activity) && (str(w.location) || p != null)) e[`workItems.${i}.activity`] = "Describe the activity";
    if (p != null && (p < 0 || p > 100)) e[`workItems.${i}.progress`] = "0–100";
  });
  f.materials.forEach((m, i) => {
    if (!str(m.name) && str(m.quantity) === "") return;
    if (!str(m.name)) e[`materials.${i}.name`] = "Material name";
    const q = num(m.quantity);
    if (q == null || q < 0) e[`materials.${i}.quantity`] = "Qty";
  });
  f.issueItems.forEach((it, i) => {
    if (!str(it.description)) e[`issueItems.${i}.description`] = "Describe the issue";
  });

  if (status === "SUBMITTED") {
    const hasWork = f.workItems.some((w) => str(w.activity)) || str(f.workCompleted);
    if (!hasWork) e.workItems = "Add at least one activity before submitting";
    const hasManpower = f.manpower.some((m) => m.trade && num(m.headcount) != null);
    if (!hasManpower && f.siteCondition !== "CLOSED") e.manpower = "Add manpower on site (or mark the site as closed)";
    if (f.safetyIncident && !str(f.safetyNotes)) e.safetyNotes = "Describe the incident";
  }
  return e;
};

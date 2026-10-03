// Shared helpers for Design Studio drawing pages (upload, register, detail).
import { API_URL } from "@/lib/config";

export const DISCIPLINES = [
  { value: "Architecture", code: "AR" },
  { value: "Interior", code: "ID" },
  { value: "Structural", code: "ST" },
  { value: "Electrical", code: "EL" },
  { value: "Plumbing", code: "PL" },
  { value: "HVAC", code: "ME" },
  { value: "Landscape", code: "LA" },
  { value: "Joinery", code: "JN" },
];

export const disciplineCode = (d) =>
  DISCIPLINES.find((x) => x.value === d)?.code ||
  String(d || "GN")
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 2)
    .toUpperCase() ||
  "GN";

// Status values accepted by the backend (drawings + drawing_revisions).
export const STATUSES = ["Draft", "For Review", "Approved", "For Construction", "Superseded", "Rejected"];

const STATUS_TONE = {
  draft: "mute",
  "for review": "lilac",
  approved: "ok",
  "for construction": "info",
  superseded: "mute",
  rejected: "bad",
};
export const statusTone = (s) => STATUS_TONE[String(s || "draft").toLowerCase()] || "mute";

// Project phases (same codes as the document-type phase tree).
export const PHASES = [
  { value: "03_PRE_DESIGN", label: "Pre-design" },
  { value: "04_PLANNING", label: "Planning" },
  { value: "05_DESIGN", label: "Design" },
  { value: "06_TENDER", label: "Tender" },
  { value: "07_WORKING", label: "Working drawings" },
  { value: "08_EXECUTION", label: "Execution" },
  { value: "09_HANDOVER", label: "Handover / as-built" },
];
export const phaseLabel = (code) => PHASES.find((p) => p.value === code)?.label || code || "—";

export const SHEET_SIZES = ["A0", "A1", "A2", "A3", "A4"];
export const SCALES = ["1:1", "1:5", "1:10", "1:20", "1:25", "1:50", "1:75", "1:100", "1:200", "1:500", "NTS"];

export const ACCEPT = ".pdf,.dwg,.dxf,.jpg,.jpeg,.png,.webp";
export const ACCEPT_EXT = ["pdf", "dwg", "dxf", "jpg", "jpeg", "png", "webp"];

export const extOf = (name = "") => (String(name).split(".").pop() || "").toLowerCase();

export function fileKind({ name, mime } = {}) {
  const ext = extOf(name);
  const m = String(mime || "").toLowerCase();
  if (m.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  if (m.includes("pdf") || ext === "pdf") return "pdf";
  if (ext === "dwg") return "dwg";
  if (ext === "dxf") return "dxf";
  return "file";
}

export const KIND_TONE = { pdf: "peach", dwg: "info", dxf: "lilac", image: "ok", file: "mute" };

export function projectCode(name = "") {
  const words = String(name)
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "PRJ";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export const numberPrefix = (projectName, discipline) => `${projectCode(projectName)}-${disciplineCode(discipline)}-`;

/** Highest trailing sequence already used for `prefix` among drawing numbers. */
export function maxSequence(numbers, prefix) {
  let max = 0;
  for (const n of numbers) {
    if (!n || !String(n).toUpperCase().startsWith(prefix.toUpperCase())) continue;
    const m = String(n).match(/(\d+)\s*$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

export const pad3 = (n) => String(n).padStart(3, "0");

export function titleFromFilename(name = "") {
  const base = String(name).replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s*-\s*/g, " - ").replace(/\s+/g, " ").trim();
  if (!base) return "";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === "") return "—";
  const b = Number(bytes);
  if (b < 1024) return `${b} B`;
  const units = ["KB", "MB", "GB"];
  let v = b / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${units[i]}`;
}

export function formatDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d).slice(0, 10);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export const createdAt = (r) => r?.created_at || r?.createdAt || null;
export const updatedAt = (r) => r?.updated_at || r?.updatedAt || createdAt(r);

export function sortedRevisions(drawing) {
  const revs = Array.isArray(drawing?.revisions) ? drawing.revisions : [];
  return [...revs].sort((a, b) => new Date(createdAt(b) || 0) - new Date(createdAt(a) || 0));
}
export const latestRevision = (drawing) => sortedRevisions(drawing)[0] || null;

/** Next revision label after the drawing's latest (A → B, R0 → R1, 3 → 4). */
export function nextRevisionLabel(drawing) {
  const last = latestRevision(drawing)?.revision;
  if (!last) return "A";
  if (/^[A-Y]$/i.test(last)) return String.fromCharCode(last.toUpperCase().charCodeAt(0) + 1);
  const m = String(last).match(/^(.*?)(\d+)$/);
  if (m) return `${m[1]}${Number(m[2]) + 1}`;
  return `${last}-1`;
}

/**
 * Upload a file as a drawing revision with real progress events.
 * POST /drawings/:id/revisions (multipart). RTK Query's fetch can't report progress, so XHR here.
 */
export function uploadRevision({ drawingId, file, data = {}, onProgress }) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
    });
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/drawings/${drawingId}/revisions`);
    xhr.withCredentials = true;
    let token;
    try {
      token = localStorage.getItem("bc_token");
    } catch {
      token = null;
    }
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body);
      else reject(new Error(body?.message ? [].concat(body.message).join(", ") : `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading"));
    xhr.send(fd);
  });
}

export const errMessage = (e, fallback = "Something went wrong") =>
  (e?.data?.message && [].concat(e.data.message).join(", ")) || e?.message || fallback;

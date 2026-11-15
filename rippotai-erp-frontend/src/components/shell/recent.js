// "Continue working": the last opened project and the last few documents,
// kept per user in this browser (localStorage). The shell records visits to
// project pages and document detail pages automatically; pages can also call
// useTrackVisit() themselves.
import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/context/AuthContext";

const EVENT = "inos-recent";
const MAX_DOCS = 6;
const keyFor = (uid) => `inos.recent.${uid || "anon"}`;

export function readRecent(uid) {
  try {
    const v = JSON.parse(localStorage.getItem(keyFor(uid)) || "{}");
    return { project: v.project || null, docs: Array.isArray(v.docs) ? v.docs : [] };
  } catch {
    return { project: null, docs: [] };
  }
}

function write(uid, value) {
  try {
    localStorage.setItem(keyFor(uid), JSON.stringify(value));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable */
  }
}

/** entry: { kind: "project" | "document", id?, to, label, code?, type? } */
export function recordVisit(uid, entry) {
  if (!uid || !entry?.to || !entry?.label) return;
  const cur = readRecent(uid);
  const at = Date.now();
  if (entry.kind === "project") {
    const same = cur.project && cur.project.to === entry.to && cur.project.label === entry.label && cur.project.code === entry.code;
    if (same) return;
    write(uid, { ...cur, project: { id: entry.id, to: entry.to, label: entry.label, code: entry.code || null, at } });
    return;
  }
  const docs = cur.docs.filter((d) => d.to !== entry.to);
  if (cur.docs[0]?.to === entry.to && cur.docs[0]?.label === entry.label && cur.docs[0]?.code === entry.code) return;
  docs.unshift({ to: entry.to, label: entry.label, code: entry.code || null, type: entry.type || null, at });
  write(uid, { ...cur, docs: docs.slice(0, MAX_DOCS) });
}

const EMPTY = { project: null, docs: [] };
let cached = { key: null, raw: null, value: EMPTY };
function snapshot(uid) {
  let raw;
  try {
    raw = localStorage.getItem(keyFor(uid));
  } catch {
    raw = null;
  }
  if (cached.key !== uid || cached.raw !== raw) cached = { key: uid, raw, value: raw ? readRecent(uid) : EMPTY };
  return cached.value;
}
function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useRecent() {
  const { user } = useAuth();
  const uid = user?.id;
  return useSyncExternalStore(subscribe, () => snapshot(uid), () => EMPTY);
}

/** Record a visit from a page (e.g. a document view) once its label is known. */
export function useTrackVisit(entry) {
  const { user } = useAuth();
  const uid = user?.id;
  const { kind, id, to, label, code, type } = entry || {};
  useEffect(() => {
    if (uid && to && label) recordVisit(uid, { kind, id, to, label, code, type });
  }, [uid, kind, id, to, label, code, type]);
}

const ID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+)$/i;
const SKIP = /\/(edit|new|create|upload|workspace\/?$)/i;

/** What a location is, for automatic tracking: a project page, a document page, or nothing. */
export function classifyLocation(pathname, search = "") {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "projects" && parts.length === 2 && ID.test(parts[1])) return { kind: "project", id: parts[1] };
  if (SKIP.test(pathname) && !/[?&]view=1/.test(search)) return null;
  if (parts.some((p) => ID.test(p))) return { kind: "document" };
  if (/[?&](checklistId|plannerId)=/.test(search) && /[?&]view=1/.test(search)) return { kind: "document" };
  return null;
}

/** First segment of an info line when it looks like a record code (BOQ-024, PRJ-001, RA/PO/26-27/0113). */
export function codeFromInfo(info) {
  if (typeof info !== "string") return null;
  const first = info.split("·")[0].trim();
  return /^[A-Z][A-Z0-9]*(?:[-/][A-Z0-9-]+)+(?:\s+v\d+)?$/.test(first) ? first : null;
}

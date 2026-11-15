// Automatic breadcrumbs: Home › App › Section › Item › [extra…] › Current.
// App / section / item come from the shell's sidebar match; pages may pass
// extra crumbs (e.g. the project a record belongs to). Crumbs written for the
// old app structure (CRM, Site Operations, Workspace, …) are dropped so every
// page shows the same trail.
import { APP_META } from "@/config/appNav";

const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");
const pathOf = (to) => (typeof to === "string" ? to.split(/[?#]/)[0].replace(/\/(all|list)$/, "") : "");

const APP_BASES = new Set(Object.values(APP_META).map((m) => m.base));
const LEGACY = new Set([...Object.values(APP_META).map((m) => norm(m.name)), "workspace", "site operations", "home", "inos"]);

export function buildCrumbs({ app, active, activeExact, title, crumbs, trail = true }) {
  const out = [{ label: "Home", to: "/dashboard" }];
  const meta = APP_META[app];
  if (trail && meta && app !== "dashboard") {
    out.push({ label: meta.name, to: meta.base });
    if (active) {
      if (active.group && norm(active.group) !== norm(meta.name) && norm(active.group) !== norm(active.label))
        out.push({ label: active.group });
      // On the item's own page the title names it ("PO" → "Purchase Order").
      if (norm(active.label) !== norm(meta.name) && !(activeExact && title)) out.push({ label: active.label, to: active.to });
    }
  }
  const seenLabels = new Set(out.map((c) => norm(c.label)));
  const seenPaths = new Set(out.filter((c) => c.to).map((c) => pathOf(c.to)));
  if (trail && active?.to) seenPaths.add(pathOf(active.to));
  const extra = (Array.isArray(crumbs) ? crumbs : []).filter((c, i, all) => {
    if (!c || !c.label) return false;
    const label = norm(c.label);
    if (seenLabels.has(label)) return false;
    if (c.to && (APP_BASES.has(pathOf(c.to)) || seenPaths.has(pathOf(c.to)))) return false;
    if (!c.to && LEGACY.has(label)) return false;
    if (c.to && LEGACY.has(label)) return false;
    // The last crumb without a link stands for the current page: the title replaces it.
    if (!c.to && i === all.length - 1 && title) return false;
    return true;
  });
  const list = [...out, ...extra];
  const t = typeof title === "string" ? title.trim() : title;
  if (t && norm(list[list.length - 1].label) !== norm(t)) list.push({ label: t });
  return list.map((c, i) => (i === list.length - 1 ? { label: c.label, current: true } : c));
}

/** Where the mobile back arrow goes when there is no in-app history. */
export function parentOf(list) {
  for (let i = list.length - 2; i >= 0; i -= 1) if (list[i].to) return list[i].to;
  return "/dashboard";
}

import { APP_MENUS, navigationPath } from "@/config/appNav";
import { filterMenus } from "@/lib/permissions";

/** Flatten an app's menu into sidebar rows: { section?, group?, label, to }. */
export function sidebarItems(app, user) {
  const menus = filterMenus(APP_MENUS[app] || [], app, user, navigationPath);
  const rows = [];
  for (const g of menus) {
    if (g.items?.length) {
      g.items.forEach((it, i) =>
        rows.push({ section: i === 0 ? g.label : null, group: g.label, label: it.label, to: navigationPath(app, it.slug) }),
      );
    } else if (g.slug) {
      rows.push({ section: null, group: null, label: g.label, to: navigationPath(app, g.slug) });
    }
  }
  return rows;
}

// A list page's detail pages live next to it: /ledger/boq/all → /ledger/boq/<id>.
const listBase = (p) => p.replace(/\/(all|list)$/, "");

/** Best match for the current location among the sidebar rows (longest path prefix). */
export function activeItem(rows, location) {
  const here = `${location.pathname}${location.search}`;
  let best = null;
  let bestLen = 0;
  for (const r of rows) {
    const [p, q] = r.to.split("?");
    const exact = q ? here === r.to : location.pathname === p;
    if (exact) return r;
    if (q) continue;
    const base = listBase(p);
    const prefix = base.length > 1 && location.pathname.startsWith(`${base}/`);
    if (prefix && base.length > bestLen) {
      best = r;
      bestLen = base.length;
    }
  }
  return best;
}

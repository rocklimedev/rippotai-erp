import { Navigate, useLocation } from "react-router-dom";

/**
 * Pre-app-shell URLs (/boq/…, /vendors/…, /quotations/…, /documents/…) are still
 * used by many navigate() calls and by backend-generated links. Instead of
 * bouncing them to /dashboard via the catch-all, map each onto its current
 * app route, keeping the rest of the path and the query string.
 */
const DOC_APP = {
  brief: "/crm/brief",
  recce: "/crm/recce",
  "site-recce": "/crm/recce",
  "plan-of-action": "/crm/plan-of-action",
  "scope-of-work": "/crm/scope-of-work",
  "payment-schedule": "/ledger/payment-schedule",
  "budget-estimate": "/ledger/budget-estimate",
  "budget-estimates": "/ledger/budget-estimates",
};

export function legacyTarget(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const [head, ...rest] = parts;
  const tail = rest.join("/");

  switch (head) {
    case "boq":
      return tail ? `/ledger/boq/${tail}` : "/ledger/boq/all";
    case "vendors":
      return tail ? `/procurement/vendors/${tail}` : "/procurement/vendors/directory";
    case "quotations":
    case "estimates":
      return tail ? `/procurement/estimates/${tail}` : "/procurement/estimates/all";
    case "materials":
      return tail ? `/procurement/${tail}` : "/procurement";
    case "documents": {
      if (!tail) return "/projects/documents/all";
      const [kind, id, ...more] = rest;
      if (DOC_APP[kind]) {
        if (!id) return `${DOC_APP[kind]}/all`;
        return [DOC_APP[kind], id, ...more].join("/");
      }
      if (kind === "all" || kind === "upload") return `/projects/documents/${kind}`;
      return "/projects/documents/all";
    }
    default:
      return "/dashboard";
  }
}

export default function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`${legacyTarget(pathname)}${search}${hash}`} replace />;
}

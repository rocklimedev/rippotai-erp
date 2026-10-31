import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RouteAccessContext } from "@/hooks/use-permission";
import { APP_META } from "@/config/appNav";
import { appForPath, canOpenApp, documentAccess, routeRequirement } from "@/lib/permissions";
import NoAccess from "./NoAccess";

const BANNER = { display: "flex", alignItems: "center", gap: 8, margin: "12px auto 0", maxWidth: 1200, padding: "8px 14px", borderRadius: 10, background: "var(--sage-50, #f1f5f2)", color: "var(--text-2, #44524f)", fontSize: 13 };
// Common action buttons on document lists / detail pages, hidden when the
// role's level does not include the action (backend still enforces).
const HIDE_CSS = {
  create: '[data-testid$="-new-btn"], [data-testid^="btn-create"], [data-testid$="-create-btn"] { display: none !important; }',
  edit: '[data-testid*="-edit-"], [data-testid$="-edit-btn"], main button[title="Edit"], main a[title="Edit"] { display: none !important; }',
  delete: '[data-testid*="-delete-"], [data-testid$="-delete-btn"], main button[title="Delete"], main button[title="Remove"] { display: none !important; }',
};
const NEED = { read: "view", update: "edit", create: "create" };
const FLAG = { read: "canView", update: "canEdit", create: "canCreate" };

/**
 * Central router guard: blocks apps the role cannot open and document routes
 * whose resource/action it lacks; renders record pages read-only for
 * "View only" roles.
 */
export default function RouteAccessGate({ children }) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const app = appForPath(pathname);
  const req = routeRequirement(pathname, search);
  const access = useMemo(() => (req ? documentAccess(user, req.resource) : null), [user, req]);

  if (app && !canOpenApp(user, app)) {
    return <NoAccess what={APP_META[app]?.name || "this app"} need="view" />;
  }
  if (!req) return children;
  if (!access[FLAG[req.action]]) {
    return <NoAccess what="this document" action={req.action} need={NEED[req.action]} />;
  }
  const readOnly = req.workspace && access.readOnly;
  const hide = [!access.canCreate && "create", !access.canEdit && "edit", !access.canDelete && "delete"].filter(Boolean);
  return (
    <RouteAccessContext.Provider value={access}>
      {hide.length > 0 && <style>{hide.map((h) => HIDE_CSS[h]).join("\n")}</style>}
      {readOnly ? (
        <>
          <div role="status" data-testid="readonly-banner" style={BANNER}>
            <Eye size={14} aria-hidden /> View only — your role can read this document but not change it.
          </div>
          <fieldset disabled data-testid="readonly-scope" style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
            {children}
          </fieldset>
        </>
      ) : (
        children
      )}
    </RouteAccessContext.Provider>
  );
}

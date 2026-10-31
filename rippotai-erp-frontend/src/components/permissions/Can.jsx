import { useAccess, useRouteAccess } from "@/hooks/use-permission";

/**
 * Render children only when allowed.
 *   <Can resource="boq" action="create">…</Can>
 *   <Can I="boq:delete">…</Can>
 *   <Can action="create">…</Can>   (resource taken from the current route)
 */
export default function Can({ I, resource, action, app, fallback = null, children }) {
  const access = useAccess();
  const route = useRouteAccess();
  let allowed = true;
  if (app) allowed = access.canOpenApp(app);
  else if (I) allowed = access.can(I);
  else if (resource) allowed = access.can(resource, action || "read");
  else if (action) {
    const map = { read: "canView", update: "canEdit", create: "canCreate", delete: "canDelete" };
    allowed = route.resource ? Boolean(route[map[action]] ?? access.can(route.resource, action)) : true;
  }
  if (!allowed) return typeof fallback === "function" ? fallback() : fallback;
  return typeof children === "function" ? children() : children;
}

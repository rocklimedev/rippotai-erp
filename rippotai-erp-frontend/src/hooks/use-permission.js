import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { appLevel, canOpenApp, documentAccess, hasPermission, routeRequirement } from "@/lib/permissions";

/** `usePermission("boq", "create")` or `usePermission("boq:create")`. */
export function usePermission(resource, action) {
  const { user } = useAuth();
  return hasPermission(user, resource, action);
}

/** Bundle of helpers bound to the signed-in user. */
export function useAccess() {
  const { user } = useAuth();
  return useMemo(
    () => ({
      user,
      can: (resource, action) => hasPermission(user, resource, action),
      canOpenApp: (app) => canOpenApp(user, app),
      appLevel: (app) => appLevel(user, app),
      document: (resource) => documentAccess(user, resource),
    }),
    [user],
  );
}

/** View / edit / create / delete flags for one document resource. */
export function useDocumentAccess(resource) {
  const { user } = useAuth();
  return useMemo(() => documentAccess(user, resource), [user, resource]);
}

export const RouteAccessContext = createContext(null);

/**
 * Access for the document the current URL points at (no arguments needed).
 * Falls back to "everything allowed" on routes not mapped to a resource.
 */
export function useRouteAccess() {
  const fromGuard = useContext(RouteAccessContext);
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  return useMemo(() => {
    if (fromGuard) return fromGuard;
    const req = routeRequirement(pathname, search);
    if (!req) return { resource: null, canView: true, canEdit: true, canCreate: true, canDelete: true, readOnly: false };
    return documentAccess(user, req.resource);
  }, [fromGuard, user, pathname, search]);
}

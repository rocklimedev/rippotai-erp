import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

/**
 * RequirePortalAccess
 * --------------------
 * Wraps the portal's protected routes. Assumes the user is already
 * authenticated (pair this with whatever "logged in at all" check/route
 * guard you already have — this component only handles the second gate:
 * "logged in, but allowed past the door?").
 *
 * Blocks two cases, both redirecting to /no-access instead of the portal:
 *   - user.role === "USER"     (default signup role, no portal access)
 *   - user.is_active === false (deactivated account)
 *
 * Usage with react-router v6 nested routes:
 *
 *   <Route element={<RequirePortalAccess />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/projects" element={<Projects />} />
 *     ...
 *   </Route>
 *   <Route path="/no-access" element={<NoAccess />} />
 *
 * Do not wrap /login, /signup, or /no-access itself with this guard.
 */
export default function RequirePortalAccess() {
  const { hasPortalAccess } = useAuth();
  const location = useLocation();

  // hasPortalAccess is `false` for a blocked user, `null` if there's no
  // user yet at all (not logged in) — either way, this guard isn't the
  // right place to send them anywhere but /no-access; pair this component
  // with your existing "must be logged in" guard for the null case.
  if (hasPortalAccess === false) {
    return <Navigate to="/no-access" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

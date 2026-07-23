import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { allSlugsFor } from "@/config/appNav";
import SectionPage from "@/pages/SectionPage";

/**
 * Wraps a route element so it requires auth.
 * blockRoles: roles that should be bounced to /dashboard even if logged in.
 */
export function Protected({ children, blockRoles }) {
  const { user, ready } = useAuth();

  if (!ready)
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-sm" style={{ color: "#6B7B7C" }}>
          Loading INOS…
        </div>
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (blockRoles && blockRoles.includes(user.role))
    return <Navigate to="/dashboard" replace />;

  return children;
}

/** Wraps a route element so it's only reachable when logged out (login/register/signup). */
export function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

/** "/" -> /dashboard or /login depending on auth state. */
export function RootRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

/**
 * Any sidebar slug for `appKey` that isn't already covered by a hand-built
 * page gets a generic, functional SectionPage instead of ComingSoon.
 *
 * Returns plain { path, element } descriptors (not <Route> yet) so callers
 * can merge them with static children before generateRoutes turns
 * everything into JSX.
 */
export function sectionRoutes(appKey, realSlugs = []) {
  const set = new Set([...realSlugs, "edit-dashboard"]);
  return allSlugsFor(appKey)
    .filter((it) => it.slug && !it.slug.startsWith("/") && !set.has(it.slug))
    .map((it) => ({
      path: it.slug,
      element: <SectionPage appKey={appKey} slugOverride={it.slug} />,
    }));
}

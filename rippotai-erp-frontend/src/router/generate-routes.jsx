import { Route, Navigate } from "react-router-dom";
import { Protected, PublicOnly, sectionRoutes } from "../lib/route.helpers";

function resolveChildren(children = [], dynamicSections) {
  const rendered = children.map((child) => (
    <Route
      key={child.path ?? "index"}
      index={child.index}
      path={child.path}
      element={child.element}
    />
  ));

  if (dynamicSections) {
    const staticPaths = children.filter((c) => c.path).map((c) => c.path);

    const extra = sectionRoutes(dynamicSections.appKey, [
      ...staticPaths,
      ...(dynamicSections.exclude || []),
    ]);

    rendered.push(
      ...extra.map((r) => (
        <Route key={r.path} path={r.path} element={r.element} />
      )),
    );
  }

  return rendered;
}

export function generateRoutes(routes) {
  return routes.flatMap((route) => {
    switch (route.type) {
      case "redirect":
        return (
          <Route
            key={route.path}
            path={route.path}
            element={<Navigate to={route.to} replace />}
          />
        );

      // ==========================================
      // PUBLIC-ONLY
      // Login / Register / Signup
      // ==========================================
      case "public":
        return (
          <Route
            key={route.path}
            path={route.path}
            element={<PublicOnly>{route.element}</PublicOnly>}
          />
        );

      // ==========================================
      // NO AUTH
      // Completely public pages
      // Privacy / Terms / Marketing pages etc.
      // ==========================================
      case "noauth":
        return (
          <Route key={route.path} path={route.path} element={route.element} />
        );

      // ==========================================
      // RAW
      // No auth wrapper
      // ==========================================
      case "raw":
        return (
          <Route key={route.path} path={route.path} element={route.element} />
        );

      // ==========================================
      // PROTECTED LAYOUT
      // ==========================================
      case "layout": {
        const Layout = route.layout;

        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Protected blockRoles={route.blockRoles}>
                <Layout {...(route.layoutProps || {})} />
              </Protected>
            }
          >
            {resolveChildren(route.children, route.dynamicSections)}
          </Route>
        );
      }

      // ==========================================
      // DEFAULT PROTECTED ROUTE
      // ==========================================
      default:
        return (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Protected blockRoles={route.blockRoles}>
                {route.element}
              </Protected>
            }
          />
        );
    }
  });
}

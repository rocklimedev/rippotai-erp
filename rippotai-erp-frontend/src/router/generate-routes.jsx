import { Route, Navigate } from "react-router-dom";
import { Protected, PublicOnly, sectionRoutes } from "../lib/route.helpers";

/**
 * Route config shapes understood here:
 *
 * { type: "redirect", path, to }
 *   -> <Route path element={<Navigate to replace />} />
 *
 * { type: "public", path, element }
 *   -> logged-out-only route (login/register/signup)
 *
 * { type: "raw", path, element }
 *   -> rendered as-is, no auth wrapper (e.g. a sub-router that handles
 *      its own auth, like the client portal)
 *
 * { path, element, blockRoles? }
 *   -> default: a single protected route, no children
 *
 * { type: "layout", path, layout, layoutProps?, blockRoles?, dynamicSections?, children }
 *   -> a protected parent route rendering `layout` with nested <Outlet /> children.
 *      children: [{ index?: true, path?, element }]
 *      dynamicSections: { appKey, exclude: [] } to auto-append sectionRoutes()
 */

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

      case "public":
        return (
          <Route
            key={route.path}
            path={route.path}
            element={<PublicOnly>{route.element}</PublicOnly>}
          />
        );

      case "raw":
        return (
          <Route key={route.path} path={route.path} element={route.element} />
        );

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

      default:
        // plain protected flat route
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

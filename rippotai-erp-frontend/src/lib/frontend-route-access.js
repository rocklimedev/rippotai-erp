import { matchRoutes } from 'react-router-dom';

let routerRoutes = [];
let routePatterns = new Set();

export function setFrontendRouteCatalogue(routes) {
  routerRoutes = routes;
  routePatterns = new Set();

  function collect(entries, parent = '') {
    for (const route of entries) {
      const path = route.path?.startsWith('/') ? route.path
        : [parent, route.path].filter(Boolean).join('/');
      if (route.handle?.restrictable && path && !path.includes('*'))
        routePatterns.add(path.toLowerCase());
      if (route.children) collect(route.children, path);
    }
  }

  collect(routes);
}

export function getFrontendRoutePatterns() {
  return [...routePatterns].sort();
}

export function canOpenFrontendRoute(user, path) {
  const restrictions = user?.frontend_route_restrictions;
  if (!restrictions?.length) return true;
  const matches = matchRoutes(routerRoutes, path);
  const registeredPattern = matches?.reduce((parent, { route }) =>
    route.path?.startsWith('/') ? route.path : [parent, route.path].filter(Boolean).join('/'), '');
  if (registeredPattern && restrictions.includes(registeredPattern.toLowerCase())) return false;

  // Existing URL-specific and wildcard restrictions keep their pattern semantics.
  return !matchRoutes(
    restrictions.filter((pattern) => !routePatterns.has(pattern)).map((pattern) => ({ path: pattern })),
    path,
  );
}

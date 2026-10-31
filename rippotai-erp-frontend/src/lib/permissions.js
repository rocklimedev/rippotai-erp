// Single source for client-side permission checks. The backend is the real
// enforcement (PermissionsGuard); this only hides what the user cannot use.
import { APP_META, AUTOMATION_APP_ENABLED, navigationAppFor } from '@/config/appNav';

export const ACCESS_LEVELS = [
  { key: 'none', label: 'No access', short: 'None', description: 'Hidden. Cannot be opened.' },
  {
    key: 'view',
    label: 'View only',
    short: 'View',
    description: 'Open, read, print and export. Forms are read-only.',
  },
  {
    key: 'edit',
    label: 'View & Edit',
    short: 'Edit',
    description: 'View, plus change existing records, upload files and submit for review.',
  },
  {
    key: 'create',
    label: 'Create',
    short: 'Create',
    description: 'View & Edit, plus start new records, issue and deliver them.',
  },
  {
    key: 'full',
    label: 'Full access (incl. Remove)',
    short: 'Full',
    description: 'Create, plus delete/restore, approve or reject, lock and final decisions.',
  },
];
export const LEVEL_RANK = { none: 0, view: 1, edit: 2, create: 3, full: 4 };

// Launcher apps that are hidden / blocked when the role has no access.
export const GATED_APPS = [
  'projects',
  'design',
  'build',
  'tasks',
  'calendar',
  'commandCenter',
  'adminConsole',
  'automation',
];

export function hasPermission(user, resource, action) {
  const perm = action ? `${resource}:${action}` : resource;
  return Array.isArray(user?.permissions) && user.permissions.includes(perm);
}

export function appLevel(user, app) {
  const apps = user?.access?.apps;
  if (!apps || !(app in apps)) return 'full'; // unknown to the catalogue: do not hide
  return apps[app];
}

export function canOpenApp(user, app) {
  if (app === 'automation' && !AUTOMATION_APP_ENABLED) return false;
  if (!GATED_APPS.includes(app)) return true;
  return appLevel(user, app) !== 'none';
}

/** Launcher app owning a URL path (longest APP_META base match). */
export function appForPath(pathname = '') {
  if (pathname === '/clients' || pathname.startsWith('/clients/')) return 'projects';
  if (pathname.startsWith('/document/')) return 'projects';
  let best = null;
  for (const [key, meta] of Object.entries(APP_META)) {
    const base = meta.base;
    if (!base || base === '/') continue;
    if (
      (pathname === base || pathname.startsWith(`${base}/`)) &&
      (!best || base.length > APP_META[best].base.length)
    )
      best = key;
  }
  return best ? navigationAppFor(best, pathname) : null;
}

// Document / record routes -> the backend resource they read and write.
const ROUTE_RESOURCES = [
  [/^\/crm\/(brief|forms\/project-brief)/, 'project-briefs'],
  [/^\/crm\/(recce|forms\/site-reki)/, 'site-recces'],
  [/^\/crm\/(scope-of-work|forms\/scope-of-work)/, 'scope-of-work'],
  [/^\/crm\/(plan-of-action|forms\/plan-of-action)/, 'plan-of-actions'],
  [/^\/crm\/(business-proposal|forms\/business-proposal)/, 'business-proposals'],
  [/^\/crm\/(pipeline|leads)/, 'leads'],
  [/^\/ledger\/(payment-schedule|forms\/payment-schedule|aggrements)/, 'payment-schedules'],
  [/^\/ledger\/(budget-estimates?|forms\/budget-estimate)/, 'budget-estimates'],
  [/^\/ledger\/budget-guides/, 'budget-guides'],
  [/^\/ledger\/boq\/(templates|template)/, 'boq-templates'],
  [/^\/ledger\/boq\/rate-and-item-library/, 'library'],
  [/^\/ledger\/boq/, 'boq'],
  [/^\/procurement\/estimates/, 'quotations'],
  [/^\/procurement\/purchase-orders/, 'purchase-orders'],
  [/^\/procurement\/work-order/, 'work-orders'],
  [/^\/procurement\/delivery-challans/, 'delivery-challans'],
  [/^\/procurement\/requirements/, 'procurement-requirements'],
  [/^\/procurement\/rate-sheets/, 'procurement-rate-sheets'],
  [/^\/procurement\/sample-boards/, 'procurement-sample-boards'],
  [/^\/procurement\/quotations/, 'procurement-quotations'],
  [/^\/procurement\/vendors\/rate-comparison/, 'vendor-rate-comparisons'],
  [/^\/procurement\/vendors\/shortlists/, 'project-shortlists'],
  [/^\/procurement\/vendors/, 'vendors'],
  [/^\/procurement\/material-procurement/, 'material-procurement'],
  [/^\/site-operations\/daily-reports/, 'site-ops-daily-reports'],
  [/^\/site-operations\/admin-dpr/, 'dpr-admin-reports'],
  [/^\/site-operations\/snag-lists/, 'site-ops-snag-lists'],
  [/^\/site-operations\/checklists/, 'quality-checklists'],
  [/^\/site-operations\/(site-visits|visit-assignments)/, 'site-ops-visits'],
  [/^\/site-operations\/rfis/, 'site-ops-rfis'],
  [/^\/site-operations\/mockups/, 'site-ops-mockups'],
  [/^\/design-studio\/(all|new|upload|[^/]+(\/edit)?$)/, 'drawings'],
  [/^\/inventory\/site-inventory/, 'inventory'],
  [/^\/projects\/planner/, 'project-planners'],
  [/^\/projects\/documents/, 'documents'],
  [/^\/clients(\/|$)/, 'clients'],
  [/^\/automation/, 'automation'],
];

const NOT_RECORD = new Set([
  'all',
  'list',
  'workspace',
  'activity',
  'templates',
  'directory',
  'compare',
  'transactions',
  'history',
  'handoff-status',
  'sources',
  'pipeline',
  'rate-and-item-library',
]);

/** What a path needs: resource plus the action implied by the URL. */
export function routeRequirement(pathname = '', search = '') {
  const hit = ROUTE_RESOURCES.find(([re]) => re.test(pathname));
  if (!hit) return null;
  const resource = hit[1];
  const segs = pathname.split('/').filter(Boolean);
  const last = segs[segs.length - 1] || '';
  let action = 'read';
  if (
    /^(new|add|create|upload)$/.test(last) ||
    /\/forms\/[^/]+$/.test(pathname) ||
    /\/(planner\/create|template\/new)$/.test(pathname)
  )
    action = 'create';
  else if (/^(edit|editor)$/.test(last)) action = 'update';
  if (action === 'create' && /[?&](id|edit|draft|documentId|docId)=/.test(search))
    action = 'update';
  // Combined view/edit workspaces are shown read-only to "View only" roles.
  const workspace =
    action === 'read' &&
    (last === 'workspace' ||
      (/^\/ledger\/boq\/[^/]+$/.test(pathname) &&
        !NOT_RECORD.has(last) &&
        !['new', 'activity'].includes(last)));
  return { resource, action, workspace };
}

export function documentAccess(user, resource) {
  const can = (a) => hasPermission(user, resource, a);
  const canView = can('read');
  const canEdit = can('update');
  const canCreate = can('create');
  const canDelete = can('delete');
  return {
    resource,
    canView,
    canEdit,
    canCreate,
    canDelete,
    readOnly: canView && !canEdit && !canCreate,
  };
}

/** Drop nav items the user cannot open; drop groups left empty. */
export function filterMenus(menus = [], app, user, toPath) {
  const allowed = (slug) => {
    if (!slug) return true;
    const path = toPath(app, slug).split('?')[0];
    const target = appForPath(path);
    if (target && !canOpenApp(user, target)) return false;
    const req = routeRequirement(path);
    if (!req) return true;
    const flag = { read: 'canView', update: 'canEdit', create: 'canCreate' }[req.action];
    return documentAccess(user, req.resource)[flag];
  };
  return menus
    .map((g) => (g.items ? { ...g, items: g.items.filter((it) => allowed(it.slug)) } : g))
    .filter((g) => (g.items ? g.items.length > 0 || g.slug : allowed(g.slug)));
}

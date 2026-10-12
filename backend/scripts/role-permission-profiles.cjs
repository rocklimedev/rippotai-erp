// Explicit baseline profiles for the supplied role IDs; no wildcard grants.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const common = ['apps:read', 'dashboards:read', 'dashboard:read', 'project-dashboard:read',
  'command-center:read', 'projects:read', 'project-types:read', 'projects-phases:read',
  'team:read', 'users:read', 'tasks:read', 'tasks:create', 'tasks:update',
  'calendar-events:read', 'calendar-events:create', 'calendar-events:update',
  'notifications:read', 'notifications:update', 'notes:read', 'notes:create', 'notes:update',
  'workspace:read', 'search:read', 'units:read', 'phase-definitions:read',
  'workflow-library:read', 'workflow-progress:read', 'workflow-timeline:read', 'gates:read',
  'cdn:upload', 'user-signatures:read', 'user-signatures:upload'];
function caps(resources, actions) { return resources.flatMap(r => actions.map(a => `${r}:${a}`)); }
const designRead = caps(['project-briefs', 'scope-of-work', 'documents', 'drawings',
  'document-types', 'document-requirements', 'site-recces', 'project-planners',
  'boq', 'boq-templates', 'boq-catalog', 'boq-activity', 'library', 'materials',
  'project-shortlists', 'shortlist-entries', 'vendors', 'vendor-categories', 'vendor-business-types'], ['read']);
const designWrite = caps(['project-briefs', 'scope-of-work', 'documents', 'drawings',
  'document-requirements', 'project-planners', 'boq', 'project-shortlists', 'shortlist-entries'], ['create', 'update']);
const siteRead = caps(['site-recces', 'site-ops', 'architect-quality', 'architect-snags',
  'architect-visit-stages', 'quality-checklists', 'site-ops-checklists', 'site-ops-daily-reports',
  'site-ops-mockups', 'site-ops-qc', 'site-ops-rfis', 'site-ops-snag-lists', 'site-ops-visits',
  'dpr-admin-documents', 'dpr-admin-logs', 'dpr-admin-reports', 'inventory',
  'delivery-challans', 'work-orders', 'procurement-requirements'], ['read']);
const siteWrite = caps(['site-recces', 'architect-quality', 'architect-snags', 'quality-checklists',
  'site-ops-daily-reports', 'site-ops-mockups', 'site-ops-rfis', 'site-ops-snag-lists',
  'site-ops-visits', 'dpr-admin-logs', 'dpr-admin-reports', 'procurement-requirements'], ['create', 'update']);
const siteUploads = ['site-recces:upload', 'site-ops-daily-reports:upload', 'site-ops-snag-lists:upload', 'site-ops-visits:check-in'];
const commercialRead = caps(['budget-estimates', 'quotations', 'quotation-items', 'payment-schedules',
  'purchase-orders', 'procurement-estimates', 'procurement-quotations', 'procurement-rate-sheets',
  'procurement-sample-boards', 'material-procurement', 'vendor-rate-comparisons'], ['read']);
const senior = [...common, ...designRead, ...designWrite, ...siteRead, ...commercialRead,
  'project-briefs:upload', 'site-recces:upload', 'boq:submit', 'boq:export',
  'project-planners:generate', 'workflow-progress:update', 'command-center:upload',
  'quality-checklists:export', 'site-ops-snag-lists:export', 'reports:read'];
const junior = [...common, ...designRead, ...siteRead,
  ...caps(['documents', 'drawings'], ['create', 'update']), 'command-center:upload'];
const lead = [...senior, ...siteWrite, ...siteUploads, 'projects:update', 'team:create', 'team:update',
  'tasks:delete', 'command-center:complete', 'command-center:review',
  'plan-of-actions:read', 'plan-of-actions:create', 'plan-of-actions:update', 'plan-of-actions:publish',
  'workflow:read', 'workflow:create', 'workflow:update', 'workflow-progress:create',
  'site-ops-visits:assign', 'site-ops-daily-reports:share', 'client-portal:read',
  'client-portal:create', 'client-portal:prepare', 'client-portal:deliver',
  'quotations:create', 'quotations:update', 'quotations:submit', 'quotation-items:create',
  'quotation-items:update', 'budget-estimates:create', 'budget-estimates:update'];
const profiles = [
  ['06850ec5-6208-4db6-9b27-c6eed141b80b', 'USER', 'INTERNAL', [], 'Account self-service only; no staff grants'],
  ['070dd7b5-84d2-11f1-b721-52540021303b', 'SENIOR_ARCHITECT', 'INTERNAL', senior, 'Design authoring, planning and BOQ submission; no approvals'],
  ['07114f34-84d2-11f1-b721-52540021303b', 'JUNIOR_ARCHITECT', 'INTERNAL', junior, 'Design reads and document/drawing authoring'],
  ['071151f6-84d2-11f1-b721-52540021303b', 'SENIOR_INTERIOR_DESIGNER', 'INTERNAL', senior, 'Interior design authoring, planning and BOQ submission; no approvals'],
  ['07115348-84d2-11f1-b721-52540021303b', 'JUNIOR_INTERIOR_DESIGNER', 'INTERNAL', junior, 'Interior design reads and document/drawing authoring'],
  ['071153fc-84d2-11f1-b721-52540021303b', 'SITE_SUPERVISOR', 'INTERNAL', [...common, ...designRead, ...siteRead, ...siteWrite, ...siteUploads, 'site-ops-visits:assign', 'site-ops-daily-reports:share', 'workflow-progress:update', 'command-center:complete'], 'Site execution and reporting; no financial approvals or QC sign-off'],
  ['071154b6-84d2-11f1-b721-52540021303b', 'CLIENT', 'INTERNAL', [], 'Client home and client-token flows only; no staff grants'],
  ['89fd2332-97b2-11f1-9d65-52540021303b', 'PRINCIPAL_ARCHITECT', 'INTERNAL', [...lead, 'boq:approve', 'command-center:approve', 'gates:clear', 'gates:reopen', 'site-ops-qc:sign-off', 'workflow-progress:sign-off'], 'Architectural oversight and architectural approvals; no procurement/payment approvals'],
  ['89fd7ac2-97b2-11f1-9d65-52540021303b', 'PROJECT_LEAD', 'INTERNAL', lead, 'Project coordination, planning and client delivery; no financial approvals'],
  ['90de7f01-7123-11f1-8bb6-52540021303b', 'DEVELOPER', 'INTERNAL', ['apps:read', 'system:read', 'dashboards:read', 'dashboard:read', 'notifications:read', 'notifications:update', 'notes:read', 'notes:create', 'notes:update'], 'Limited system diagnostics; no business data mutation or administration'],
  ['f2571d79-a047-11f1-99c8-52540021303b', 'SITE_ENGINEER', 'INTERNAL', [...common, ...designRead, ...siteRead, ...siteWrite, ...siteUploads, 'quality-checklists:export', 'site-ops-snag-lists:export', 'workflow-progress:update', 'command-center:complete'], 'Site inspections, recce, measurements and reporting; no approvals'],
];
// Keep these distinct from the INTERNAL role names and IDs.
profiles.push(
  ['f9703e5b-b411-11f1-b327-52540021303b', 'Project Lead', 'PROJECT', lead, 'Project coordination capabilities; project membership remains a separate policy'],
  ['f9704219-b411-11f1-b327-52540021303b', 'ARCHITECT', 'PROJECT', junior, 'Project design authoring; project membership remains a separate policy'],
);
function artefacts() {
  const catalogue = JSON.parse(fs.readFileSync(path.join(root, 'src/common/security/route-catalogue.json'), 'utf8'));
  const valid = new Set(catalogue.filter(r => !r.public).map(r => r.permission));
  const normalized = profiles.map(([id,name,scope,permissions,description]) => {
    permissions = [...new Set(permissions)].sort();
    for (const permission of permissions) {
      if (!valid.has(permission)) throw Error(`Unknown capability ${name}: ${permission}`);
      if (/^(rbac|permissions|role-permissions|role-apps|auth-tokens|sessions|settings|automation|sync|auth-|zoho-|google-|onedrive)/.test(permission) || permission === 'search:reindex') throw Error(`Administrative grant in baseline: ${permission}`);
    }
    return { id,name,scope,permissions,description };
  });
  const all = [...new Set(normalized.flatMap(r => r.permissions))].sort();
  const sql = '-- Baseline grants for the supplied non-admin roles. ADMIN/SUPERADMIN are unchanged.\n' +
    '-- Additive and rerunnable: existing grants are preserved; USER/CLIENT receive no new grants.\n' +
    '-- Project-scoped role grants do not implement row visibility or project membership checks.\nSTART TRANSACTION;\n\n' +
    all.map(p => { const [resource,action]=p.split(':'); return `INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), '${p}', '${resource}', '${action}', 'Staff API capability: ${p}', NOW());`; }).join('\n') + '\n\n' +
    normalized.map(r => `-- ${r.name} (${r.scope}): ${r.description}\n` + (r.permissions.length ?
      `INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)\nSELECT r.id, p.id, NOW(), NULL FROM roles r JOIN permissions p ON CONCAT(p.resource, ':', p.action) IN (\n${r.permissions.map(p=>`  '${p}'`).join(',\n')}\n)\nWHERE r.id = '${r.id}' AND BINARY r.name = '${r.name}' AND r.scope = '${r.scope}';\n` : '-- Intentionally no staff permission INSERT for this role.\n')).join('\n') +
    '\nCOMMIT;\n\n-- Verify the role IDs/names/scopes and final grant counts after execution.\n' +
    `SELECT r.id, r.name, r.scope, COUNT(rp.permission_id) AS total_existing_and_new_grants\nFROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id\nWHERE r.id IN (\n${normalized.map(r=>`  '${r.id}'`).join(',\n')}\n)\nGROUP BY r.id, r.name, r.scope ORDER BY r.scope, r.name;\n`;
  const doc = '# Non-admin role permission baselines\n\nReview owner: ERP role owners / backend security maintainers\nLast reviewed: 2026-10-10\n\n' +
    'Apply `backend/migrations/20261010_non_admin_role_permissions.sql` after the permission catalogue migration. ADMIN and SUPERADMIN are excluded because their grants are already completed. This migration is additive and rerunnable, and matches each supplied UUID, exact role name and scope. It does not revoke existing grants. USER and CLIENT deliberately receive no staff permissions; their account/client access is handled by the existing scoped flows.\n\n' +
    'These are conservative baseline assignments inferred from the supplied descriptions: junior designers author drawings/documents; senior designers also author plans and BOQs; site roles author inspection/execution reports; leads coordinate projects and client delivery; principal architects additionally approve architectural work. Financial/procurement approvals, RBAC management, cross-user sessions, integrations, reindex and system configuration are excluded from all these profiles. DEVELOPER has diagnostics only. Business-record deletion is excluded except task deletion by leads.\n\n' +
    'PROJECT roles remain separate IDs from INTERNAL roles. Permission grants do not enforce project membership or entity ownership, and assigning a PROJECT role to a user as their global role does not restrict these capabilities to a project. Preserve existing project-scoping checks when assigning roles. Missing/mismatched roles are skipped by SQL; verify that the final report contains all 13 supplied non-admin roles. No database execution was performed.\n\n' +
    'Regenerate or check with `node scripts/role-permission-profiles.cjs` / `node scripts/role-permission-profiles.cjs --check`. Profiles contain explicit capability lists; future catalogue additions receive no grants automatically.\n\n| Role | Scope | Capabilities | Baseline |\n| --- | --- | --- | --- |\n' +
    normalized.map(r=>`| ${r.name} | ${r.scope} | ${r.permissions.length} | ${r.description} |`).join('\n') + '\n';
  return [[path.join(root,'migrations/20261010_non_admin_role_permissions.sql'),sql], [path.join(root,'../documentation/non-admin-role-permissions.md'),doc]];
}
if (require.main === module) {
  for (const [file,content] of artefacts()) {
    if (process.argv.includes('--check')) { if (fs.readFileSync(file,'utf8') !== content) throw Error(`Stale role profile artifact: ${file}`); }
    else fs.writeFileSync(file,content);
  }
  console.log('13 non-admin role profiles validated');
}
module.exports = { profiles, artefacts };

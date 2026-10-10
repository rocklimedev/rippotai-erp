// The route decorators are the source of truth. Run --check in CI; regeneration
// never assigns permissions. Review new routes and add RequirePermission first.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory()
    ? files(path.join(dir, e.name)) : e.name.endsWith('.controller.ts') ? [path.join(dir, e.name)] : []);
}
function decorators(node) {
  return (ts.getDecorators(node) || []).map(d => {
    const e = d.expression;
    return { name: ts.isCallExpression(e) ? e.expression.getText() : e.getText(),
      value: ts.isCallExpression(e) && e.arguments[0] ? e.arguments[0].text : undefined, node: d };
  });
}
function scan() {
  const routes = [];
  for (const file of files(path.join(root, 'src'))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const cls of source.statements.filter(ts.isClassDeclaration)) {
      const controller = decorators(cls).find(d => d.name === 'Controller');
      if (!controller) continue;
      for (const member of cls.members.filter(ts.isMethodDeclaration)) {
        const ds = decorators(member);
        const http = ds.find(d => ['Get','Post','Put','Patch','Delete','Head','Options','All'].includes(d.name));
        if (!http) continue;
        if (http.value !== undefined && typeof http.value !== 'string') throw Error('Nonliteral route');
        routes.push({ module: file.endsWith(`${path.sep}app.controller.ts`) ? 'system' : path.relative(path.join(root, 'src'), file).replaceAll('\\', '/').split('/')[1],
          controller: cls.name.text, handler: member.name.getText(source), method: http.name.toUpperCase(),
          path: '/' + [controller.value, http.value].filter(Boolean).join('/').replace(/^\/+|\/+$/g, ''),
          permission: ds.find(d => d.name === 'RequirePermission')?.value,
          public: ds.some(d => d.name === 'Public'),
          file: path.relative(root, file).replaceAll('\\', '/') });
      }
    }
  }
  return routes.sort((a,b) => `${a.module}/${a.controller}/${a.handler}`.localeCompare(`${b.module}/${b.controller}/${b.handler}`));
}
function render(routes) {
  for (const r of routes) if (!/^[a-z][a-z0-9_-]*:[a-z][a-z0-9_-]*$/.test(r.permission || '')) throw Error(`Missing/invalid permission: ${r.controller}.${r.handler}`);
  const keys = new Set(routes.map(r => `${r.controller}.${r.handler}`));
  if (keys.size !== routes.length) throw Error('Duplicate controller/handler');
  return JSON.stringify(routes, null, 2) + '\n';
}
function artefacts(routes) {
  const policy = fs.readFileSync(path.join(root, 'src/common/security/account-route-policy.ts'), 'utf8');
  const accounts = new Map([...policy.matchAll(/'([^']+\.[^']+)': '([^']+)'/g)].map(m => [m[1],m[2]]));
  for (const [key, permission] of accounts) {
    if (!routes.some(r => `${r.controller}.${r.handler}` === key && r.permission === permission && !r.public)) throw Error(`Invalid account exception: ${key}`);
  }
  const staff = routes.filter(r => !r.public && !accounts.has(`${r.controller}.${r.handler}`));
  const permissions = [...new Set([...staff.map(r => r.permission), 'sessions:read-any', 'sessions:revoke-any'])].sort();
  const sql = '-- Generated from reviewed route decorators. Apply before deploying global RBAC.\n' +
    '-- Existing staff grants are preserved. Only ADMIN/SUPERADMIN receive new grants.\nSTART TRANSACTION;\n' +
    permissions.map(p => { const [resource,action]=p.split(':'); return `INSERT IGNORE INTO permissions (id, name, resource, action, description, created_at) VALUES (UUID(), '${p}', '${resource}', '${action}', 'Staff API capability: ${p}', NOW());`; }).join('\n') +
    `\nINSERT IGNORE INTO role_permissions (role_id, permission_id, granted_at, granted_by)\nSELECT r.id, p.id, NOW(), NULL FROM roles r CROSS JOIN permissions p\nWHERE r.name IN ('ADMIN', 'SUPERADMIN') AND CONCAT(p.resource, ':', p.action) IN (\n${permissions.map(p=>`  '${p}'`).join(',\n')}\n);\nCOMMIT;\n`;
  const doc = '# Staff API permissions and route map\n\nReview owner: Backend security / ERP module maintainers\nLast reviewed: 2026-10-10\n\n' +
    'Global guard order: throttling → JWT authentication → PortalAccessGuard → PermissionsGuard. Missing actor IDs, staff roles, or permission metadata fail closed. USER is denied every staff route even with grants. ADMIN/SUPERADMIN do not bypass permission checks. Permission grants are loaded from the database for each authenticated request.\n\n' +
    'Public endpoints retain the separately audited @Public allow-list and their existing password/OAuth/client-link validation. Account exceptions are an exact controller/handler/permission allow-list in account-route-policy.ts: own profile, own sessions, client home, auth/me, logout and password change. Profile mutations check target ID before invoking the handler. Cross-user session lookup additionally requires ADMIN/SUPERADMIN and `sessions:read-any`; revocation additionally requires ADMIN/SUPERADMIN and `sessions:revoke-any`. Token deletion remains staff permission plus admin-only. Inactive accounts may only inspect auth/me or log out.\n\n' +
    'Deployment: apply backend/migrations/20261010_staff_route_permissions.sql before deploying. This idempotent migration creates the catalogue and grants reviewed staff capabilities to existing ADMIN/SUPERADMIN roles; other staff roles must be assigned only the module capabilities they need via the RBAC matrix. No grants are copied to USER. Review role assignments in staging before rollout. The migration has not been applied by this task.\n\n' +
    'Maintenance: add an explicit @RequirePermission(resource:action) to each new HTTP method, review the action and module, then run `node scripts/catalogue-routes.cjs`. Run `node scripts/catalogue-routes.cjs --check` in CI. Generation never assigns permissions. The unit audit rejects missing/invalid annotations and stale catalogue/docs/migration. Public and account capabilities are descriptive policies, not staff grants. No changes here add project/entity ownership checks beyond the existing service checks and the profile ownership fix; module RBAC is distinct from row visibility.\n\n' +
    `There are ${routes.length} routes, ${staff.length} staff routes and ${permissions.length} assignable staff capabilities.\n\n## Catalogue by module\n\n| Module | Resource:action capabilities |\n| --- | --- |\n` +
    [...new Set(staff.map(r=>r.module))].sort().map(m=>`| ${m} | ${[...new Set([...staff.filter(r=>r.module===m).map(r=>r.permission), ...(m==='auth'?['sessions:read-any','sessions:revoke-any']:[])])].sort().map(p=>'`'+p+'`').join(', ')} |`).join('\n') +
    '\n\n## Every route\n\n| Module | Method and path | Controller.handler | Permission | Access |\n| --- | --- | --- | --- | --- |\n' +
    routes.map(r=>`| ${r.module} | \`${r.method} ${r.path}\` | ${r.controller}.${r.handler} | \`${r.permission}\` | ${r.public?'public':accounts.has(`${r.controller}.${r.handler}`)?'account (scoped)':'staff'} |`).join('\n') + '\n';
  return [
    [path.join(root,'src/common/security/route-catalogue.json'),render(routes)],
    [path.join(root,'migrations/20261010_staff_route_permissions.sql'),sql],
    [path.join(root,'../documentation/staff-api-permissions.md'),doc],
  ];
}
if (require.main === module) {
  const routes = scan();
  for (const [target,content] of artefacts(routes)) {
    if (process.argv.includes('--check')) {
      if (fs.readFileSync(target, 'utf8') !== content) throw Error(`Stale catalogue artifact: ${path.basename(target)}; run node scripts/catalogue-routes.cjs`);
    } else fs.writeFileSync(target, content);
  }
  console.log(`${routes.length} routes mapped`);
}
module.exports = { scan, render, artefacts, decorators, files, root };

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import catalogue from '../../common/security/route-catalogue.json';
import { ACCOUNT_ROUTES } from '../../common/security/account-route-policy';
import {
  ACCESS_CATALOGUE,
  computePartLevel,
  partFor,
  permissionsForLevel,
  summarizeAccess,
} from './access-catalogue';

function sourcePermissions(dir: string, out = new Set<string>()) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) sourcePermissions(p, out);
    else if (p.endsWith('.ts') && !p.endsWith('.spec.ts')) {
      const re = /RequirePermission\(\s*['"]([^'"]+)['"]/g;
      let m: RegExpExecArray | null;
      const text = readFileSync(p, 'utf8');
      while ((m = re.exec(text))) out.add(m[1]);
    }
  }
  return out;
}

describe('access catalogue', () => {
  it('assigns every staff route permission to exactly one app part', () => {
    const exempt = new Set([
      ...catalogue.filter((r) => r.public).map((r) => r.permission),
      ...Object.values(ACCOUNT_ROUTES),
    ]);
    const unmapped = [...sourcePermissions(join(__dirname, '..', '..'))]
      .filter(
        (p) =>
          !exempt.has(p) &&
          !/^auth:|^client-token:|:callback$|^file-link:/.test(p),
      )
      .filter((p) => !partFor(p));
    expect(unmapped).toEqual([]);
  });

  it('uses unique part keys and app codes', () => {
    const keys = ACCESS_CATALOGUE.flatMap((a) => a.parts.map((p) => p.key));
    expect(new Set(keys).size).toBe(keys.length);
    const codes = ACCESS_CATALOGUE.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('computes cumulative levels', () => {
    const owned = [
      'boq:read',
      'boq:export',
      'boq:update',
      'boq:create',
      'boq:delete',
      'boq:approve',
    ];
    expect(permissionsForLevel(owned, 'view')).toEqual([
      'boq:read',
      'boq:export',
    ]);
    expect(permissionsForLevel(owned, 'create')).toHaveLength(4);
    const lvl = (g: string[]) => computePartLevel(owned, new Set(g));
    expect(lvl([]).level).toBe('none');
    expect(lvl(['boq:read', 'boq:export']).level).toBe('view');
    expect(lvl(owned).level).toBe('full');
    const noCreate = [
      'dashboards:read',
      'dashboards:update',
      'dashboards:reset',
    ];
    const r = computePartLevel(noCreate, new Set(noCreate.slice(0, 2)));
    expect(r.level).toBe('edit');
    expect(r.available).toEqual(['none', 'view', 'edit', 'full']);
    expect(lvl(['boq:read', 'boq:export', 'boq:delete'])).toMatchObject({
      level: 'view',
      maxLevel: 'full',
      custom: true,
    });
  });

  it('summarises a user permission list into app visibility', () => {
    const s = summarizeAccess([
      'site-ops-daily-reports:read',
      'site-ops-daily-reports:create',
    ]);
    expect(s.apps.build).toBe('create');
    expect(s.apps.design).toBe('none');
    expect(s.parts['build.daily-report']).toBe('create');
  });
});

import { AccessRule, decideAccess, isSuperadmin, matchesResource } from './access-policy';

const rule = (resource: string, effect: 'ALLOW' | 'DENY', action = 'view'): AccessRule =>
  ({ subject_type: 'ROLE', subject_id: 'admin', resource, action, effect });

describe('access policy', () => {
  it('denies when no grant exists', () => expect(decideAccess([], 'projects', 'edit', false)).toBe(false));
  it('honors explicit grants', () => expect(decideAccess([rule('projects', 'ALLOW')], 'projects', 'view', false)).toBe(true));
  it('denies even when another rule and a role grant allow', () => {
    expect(decideAccess([rule('*', 'ALLOW', '*'), rule('projects', 'DENY')], 'projects', 'view', true)).toBe(false);
  });
  it('does not block other actions', () => expect(decideAccess([rule('projects', 'DENY')], 'projects', 'edit', true)).toBe(true));
  it('matches named project route parameters', () => expect(matchesResource('route:/projects/:id/edit', 'route:/projects/a/edit')).toBe(true));
  it('matches page descendants', () => expect(matchesResource('route:/projects/*', 'route:/projects/a/edit')).toBe(true));
  it('does not match a sibling with the same prefix', () => expect(matchesResource('route:/projects/*', 'route:/projects-admin/a')).toBe(false));
  it('does not match missing parameters', () => expect(matchesResource('route:/projects/:id', 'route:/projects')).toBe(false));
  it('normalizes trailing slash', () => expect(matchesResource('route:/projects', 'route:/projects/')).toBe(true));
  it('only gives Superadmin the global bypass', () => {
    expect(isSuperadmin({ roleName: 'ADMIN' })).toBe(false);
    expect(isSuperadmin({ roleName: 'superadmin' })).toBe(true);
  });
});

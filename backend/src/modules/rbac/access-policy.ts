export type AccessRule = {
  subject_type: 'USER' | 'ROLE';
  subject_id: string;
  resource: string;
  action: string;
  effect: 'ALLOW' | 'DENY';
};

export function isSuperadmin(user: {
  roleName?: string | null;
  role?: string;
}) {
  return (user.roleName ?? user.role ?? '').toUpperCase() === 'SUPERADMIN';
}

/** Segment matching supports named route parameters and a terminal wildcard. */
export function matchesResource(pattern: string, resource: string): boolean {
  if (pattern === '*') return true;
  const expected = pattern.replace(/\/$/, '').split('/');
  const actual = resource.replace(/\/$/, '').split('/');
  return (
    expected.every((part, index) =>
      part === '*' && index === expected.length - 1
        ? true
        : actual[index] !== undefined &&
          (part.startsWith(':') || part === actual[index]),
    ) &&
    (expected.at(-1) === '*' || expected.length === actual.length)
  );
}

export function decideAccess(
  rules: AccessRule[],
  resource: string,
  action: string,
  granted: boolean,
): boolean {
  const applicable = rules.filter(
    (rule) =>
      matchesResource(rule.resource, resource) &&
      (rule.action === '*' || rule.action === action),
  );
  if (applicable.some((rule) => rule.effect === 'DENY')) return false;
  return granted || applicable.some((rule) => rule.effect === 'ALLOW');
}

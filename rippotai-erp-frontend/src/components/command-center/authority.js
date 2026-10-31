// Who counts as the super authority in INOS. The API enforces the same rule
// (command-center:authority permission, granted only to ADMIN / SUPERADMIN).
export const AUTHORITY_ROLES = ["ADMIN", "SUPERADMIN", "SUPER_ADMIN"];

export function isSuperAuthority(user) {
  if (!user) return false;
  const role = String(user?.role?.name ?? user?.roleName ?? user?.role ?? "").toUpperCase();
  return AUTHORITY_ROLES.includes(role) || (user.permissions ?? []).includes("command-center:authority");
}

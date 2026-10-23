import { ForbiddenException } from '@nestjs/common';

export function requireActor(actor: any, permission: string) {
  if (
    !actor?.id ||
    !Array.isArray(actor.permissions) ||
    !actor.permissions.includes(permission)
  ) {
    throw new ForbiddenException(
      `Authenticated actor with ${permission} required`,
    );
  }
}

export function assertProtectedRole(actor: any, roleName?: string | null) {
  if (
    ['ADMIN', 'SUPERADMIN'].includes(roleName ?? '') &&
    actor?.roleName !== 'SUPERADMIN'
  ) {
    throw new ForbiddenException(
      'Only SUPERADMIN may manage administrator accounts or roles',
    );
  }
}

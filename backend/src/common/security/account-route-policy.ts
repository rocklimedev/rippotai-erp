import { ExecutionContext } from '@nestjs/common';

// Inherent account capabilities, not assignable staff grants. Target ownership
// remains mandatory in the controller/service (and in the profile guard).
export const ACCOUNT_ROUTES: Readonly<Record<string, string>> = Object.freeze({
  'AuthController.me': 'account:read',
  'AuthController.logout': 'account:logout',
  'AuthController.changePassword': 'account:change-password',
  'AuthTokensController.findAllForUser': 'sessions:read-own',
  'AuthTokensController.revoke': 'sessions:revoke-own',
  'AuthTokensController.revokeAllForUser': 'sessions:revoke-own',
  'UsersController.updateProfile': 'profile:update-own',
  'UsersController.uploadAvatar': 'profile:update-own',
  'ClientPortalController.home': 'client-home:read-own',
});

export function accountCapability(
  context: ExecutionContext,
): string | undefined {
  return ACCOUNT_ROUTES[
    `${context.getClass().name}.${context.getHandler().name}`
  ];
}

export function isAccountRoute(
  context: ExecutionContext,
  permission?: string,
): boolean {
  const capability = accountCapability(context);
  return !!capability && capability === permission;
}

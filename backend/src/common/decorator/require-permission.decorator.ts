import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'required_permission';

/**
 * Matches permissions.resource + ':' + permissions.action, e.g.
 * @RequirePermission('gates:clear')
 * Resolved against role_permissions for the current user's role_id.
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

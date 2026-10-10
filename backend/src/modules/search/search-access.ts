import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export interface SearchUserContext {
  id: string;
  role?: string;
  isAdmin?: boolean;
  projectIds?: string[];
}

export function requireSearchPrincipal(user: SearchUserContext) {
  if (!user?.id?.trim() || user.id === 'anonymous') {
    throw new UnauthorizedException('Authenticated search principal required');
  }
}

export function isSearchAdmin(user: SearchUserContext) {
  requireSearchPrincipal(user);
  return user.role === 'ADMIN' || user.role === 'SUPERADMIN';
}

export function searchScopeFilter(user: SearchUserContext) {
  if (isSearchAdmin(user)) return { match_all: {} };
  if (
    !Array.isArray(user.projectIds) ||
    user.projectIds.some((id) => typeof id !== 'string' || !id.trim())
  ) {
    throw new ForbiddenException('Search project scope is unavailable');
  }
  if (!user.projectIds.length) return { match_none: {} };
  return { terms: { project_id: user.projectIds } };
}

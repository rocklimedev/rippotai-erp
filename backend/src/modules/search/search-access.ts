import { UnauthorizedException } from '@nestjs/common';

export interface SearchUserContext {
  id: string;
  role?: string;
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

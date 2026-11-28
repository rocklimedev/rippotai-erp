import { UnauthorizedException } from '@nestjs/common';
import type { DocumentTypeActor } from '@/common/security/document-type-access';

export interface SearchUserContext extends DocumentTypeActor {
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

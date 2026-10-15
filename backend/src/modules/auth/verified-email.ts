import type { User } from '../users/models/user.model';

export function hasVerifiedEmail(
  user: Pick<User, 'email' | 'email_verified_at' | 'email_verified_address'>,
): boolean {
  return !!user.email_verified_at && user.email_verified_address === user.email;
}

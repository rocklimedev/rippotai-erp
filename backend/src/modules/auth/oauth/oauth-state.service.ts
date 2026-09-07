import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface OAuthState {
  userId: string;
  provider: 'zoho' | 'google' | 'microsoft';
}

@Injectable()
export class OAuthStateService {
  constructor(private readonly jwtService: JwtService) {}

  // Short-lived, separate secret/audience from your session JWTs if possible.
  sign(state: OAuthState): string {
    return this.jwtService.sign(state, { expiresIn: '10m' });
  }

  verify(token: string): OAuthState {
    return this.jwtService.verify<OAuthState>(token);
  }
}

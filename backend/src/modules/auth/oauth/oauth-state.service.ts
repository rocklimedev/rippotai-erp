import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

export interface OAuthState {
  userId: string;
  provider: 'zoho' | 'google' | 'microsoft';
}

@Injectable()
export class OAuthStateService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getSecret(): string {
    const secret = this.configService.get<string>('OAUTH_STATE_SECRET');
    if (!secret?.trim()) {
      throw new InternalServerErrorException('OAUTH_STATE_SECRET is not configured');
    }
    return secret;
  }

  // Short-lived, separate secret/audience from your session JWTs if possible.
  sign(state: OAuthState): string {
    return this.jwtService.sign(state, {
      secret: this.getSecret(),
      expiresIn: '10m',
      audience: 'oauth-state',
      issuer: 'inos-api',
    });
  }

  verify(token: string): OAuthState {
    return this.jwtService.verify<OAuthState>(token, {
      secret: this.getSecret(),
      audience: 'oauth-state',
      issuer: 'inos-api',
    });
  }
}

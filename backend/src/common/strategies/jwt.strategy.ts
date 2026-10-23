import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '@/modules/auth/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: false,
    });
  }

  async validate(payload: any) {
    if (!payload?.jti) {
      throw new UnauthorizedException('Invalid token: missing jti');
    }

    try {
      return await this.authService.getCurrentUserFromPayload(payload);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Do not log tokens, SQL, or database messages containing account data.
      this.logger.error({
        event: 'auth.token_validation_failed',
        errorType: error instanceof Error ? error.name : 'UnknownError',
        databaseCode: (error as any)?.original?.code,
      });
      throw new UnauthorizedException('Token validation failed');
    }
  }
}

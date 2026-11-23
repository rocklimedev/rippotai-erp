import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  createHash,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import type { Request, Response } from 'express';
import { Public } from '@/common/decorator/public.decorator';
import { AuthThrottle } from '@/common/security/auth-throttle.decorator';
import { EmailVerificationService } from '../email-verification.service';

const CALLBACK_PATH = '/api/v1/auth/zoho-email/callback';
const COOKIE = 'inos_zoho_email';
const opaque = /^[A-Za-z0-9_-]{43}$/;
const digest = (value: string) =>
  createHash('sha256').update(value).digest('base64url');

type ZohoKey = {
  kty: string;
  n?: string;
  e?: string;
  kid?: string;
  alg?: string;
  use?: string;
};

@Controller('auth/zoho-email')
export class ZohoEmailVerificationController {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  private settings() {
    const clientId = this.config.get<string>('ZOHO_EMAIL_CLIENT_ID')?.trim();
    const clientSecret = this.config
      .get<string>('ZOHO_EMAIL_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.config
      .get<string>('ZOHO_EMAIL_REDIRECT_URI')
      ?.trim();
    const issuer =
      this.config.get<string>('ZOHO_EMAIL_ACCOUNTS_URL')?.trim() ||
      'https://accounts.zoho.com';
    if (!clientId || !clientSecret || !redirectUri) return;

    const callback = new URL(redirectUri);
    const secure = callback.protocol === 'https:';
    const loopback =
      callback.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(callback.hostname);
    if (
      (!secure && !loopback) ||
      callback.pathname !== CALLBACK_PATH ||
      callback.search ||
      callback.hash ||
      callback.username ||
      callback.password ||
      !/^https:\/\/accounts\.zoho\.(com|in|eu|com\.au|jp|ca|sa|com\.cn)$/.test(
        issuer,
      )
    ) {
      throw new ServiceUnavailableException(
        'Invalid Zoho email verification configuration',
      );
    }
    return { clientId, clientSecret, redirectUri, issuer, secure };
  }

  private result(response: Response, status: string) {
    const frontend = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    response.redirect(303, `${frontend}/verify-email?zoho=${status}`);
  }

  @Public()
  @AuthThrottle()
  @Get('start')
  start(@Res() response: Response) {
    response.set({
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    });
    const settings = this.settings();
    if (!settings) return this.result(response, 'unavailable');

    const verifier = randomBytes(32).toString('base64url');
    const state = digest(`zoho-email:${verifier}`);
    response.cookie(COOKIE, verifier, {
      httpOnly: true,
      sameSite: 'lax',
      secure: settings.secure,
      path: CALLBACK_PATH,
      maxAge: 10 * 60 * 1000,
    });
    const authorization = new URL('/oauth/v2/auth', settings.issuer);
    authorization.search = new URLSearchParams({
      client_id: settings.clientId,
      redirect_uri: settings.redirectUri,
      scope: 'email',
      response_type: 'code',
      state,
      code_challenge: digest(verifier),
      code_challenge_method: 'S256',
    }).toString();
    response.redirect(303, authorization.toString());
  }

  @Public()
  @AuthThrottle()
  @Get('callback')
  async callback(
    @Req() request: Request,
    @Res() response: Response,
    @Query('state') state: unknown,
    @Query('code') code: unknown,
    @Query('error') error: unknown,
  ) {
    response.set({
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    });
    const settings = this.settings();
    if (!settings) return this.result(response, 'unavailable');
    const verifier = request.headers.cookie?.match(
      /(?:^|;\s*)inos_zoho_email=([A-Za-z0-9_-]{43})(?=;|$)/,
    )?.[1];
    if (
      !verifier ||
      typeof state !== 'string' ||
      !opaque.test(state) ||
      !timingSafeEqual(
        Buffer.from(state),
        Buffer.from(digest(`zoho-email:${verifier}`)),
      )
    ) {
      return this.result(response, 'failed');
    }
    response.clearCookie(COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: settings.secure,
      path: CALLBACK_PATH,
    });
    if (
      error !== undefined ||
      typeof code !== 'string' ||
      !code ||
      code.length > 2048
    ) {
      return this.result(response, 'failed');
    }
    try {
      const token = await fetch(`${settings.issuer}/oauth/v2/token`, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(5000),
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
          redirect_uri: settings.redirectUri,
          code_verifier: verifier,
          code,
        }),
      });
      if (!token.ok) return this.result(response, 'failed');
      const { id_token: idToken } = (await token.json()) as {
        id_token?: unknown;
      };
      if (typeof idToken !== 'string') return this.result(response, 'failed');

      const email = await this.verifiedAddress(
        idToken,
        settings.issuer,
        settings.clientId,
      );
      const verified =
        email && (await this.emailVerification.verifyZohoAddress(email));
      return this.result(response, verified ? 'verified' : 'failed');
    } catch {
      return this.result(response, 'failed');
    }
  }

  private async verifiedAddress(
    token: string,
    issuer: string,
    clientId: string,
  ) {
    const [encodedHeader] = token.split('.');
    const {
      alg,
      kid,
      key_id: legacyKeyId,
    } = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString());
    const keyId = kid ?? legacyKeyId;
    if (
      (alg !== 'RS256' && alg !== 'RS384') ||
      typeof keyId !== 'string' ||
      !keyId
    )
      return;

    const jwks = await fetch(`${issuer}/oauth/v2/keys`, {
      redirect: 'error',
      signal: AbortSignal.timeout(5000),
    });
    if (!jwks.ok) return;
    const { keys } = (await jwks.json()) as { keys: ZohoKey[] };
    const key = keys.find(
      (entry) =>
        entry.kid === keyId &&
        entry.kty === 'RSA' &&
        (!entry.use || entry.use === 'sig') &&
        (!entry.alg || entry.alg === alg),
    );
    if (!key) return;
    const claims = this.jwt.verify(token, {
      // An explicit key overrides the AuthModule's default state-signing secret.
      secret: createPublicKey({ key, format: 'jwk' }).export({
        type: 'spki',
        format: 'pem',
      }),
      algorithms: [alg],
      // Zoho documents both a bare Accounts hostname and a URL issuer.
      issuer: [issuer, new URL(issuer).hostname],
      audience: clientId,
    });
    if (
      typeof claims.exp !== 'number' ||
      !Number.isFinite(claims.exp) ||
      (Array.isArray(claims.aud) &&
        claims.aud.length > 1 &&
        claims.azp !== clientId) ||
      (claims.azp !== undefined && claims.azp !== clientId) ||
      claims.email_verified !== true ||
      typeof claims.email !== 'string' ||
      !claims.email.trim()
    )
      return;
    return claims.email;
  }
}

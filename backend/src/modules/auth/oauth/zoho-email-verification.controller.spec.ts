import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { generateKeyPairSync } from 'crypto';
import type { Request, Response } from 'express';
import type { EmailVerificationService } from '../email-verification.service';
import { ZohoEmailVerificationController } from './zoho-email-verification.controller';

describe('Zoho staff email verification', () => {
  const issuer = 'https://accounts.zoho.in';
  const clientId = 'test-client';
  const frontend = 'https://erp.example.com';
  const jwt = new JwtService({ secret: 'unrelated-state-secret' });
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const key = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key' };
  const verifyZohoAddress = jest.fn().mockResolvedValue(true);
  const controller = new ZohoEmailVerificationController(
    new ConfigService({
      FRONTEND_URL: frontend,
      ZOHO_EMAIL_ACCOUNTS_URL: issuer,
      ZOHO_EMAIL_CLIENT_ID: clientId,
      ZOHO_EMAIL_CLIENT_SECRET: 'test-secret',
      ZOHO_EMAIL_REDIRECT_URI:
        'https://api.example.com/api/v1/auth/zoho-email/callback',
    }),
    jwt,
    { verifyZohoAddress } as unknown as EmailVerificationService,
  );

  function begin() {
    const response = {
      set: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
      clearCookie: jest.fn(),
    };
    controller.start(response as unknown as Response);
    const authorization = new URL(response.redirect.mock.calls[0][1]);
    const [cookie, verifier] = response.cookie.mock.calls[0];
    const request = { headers: { cookie: `${cookie}=${verifier}` } } as Request;
    response.redirect.mockClear();
    return {
      request,
      response,
      state: authorization.searchParams.get('state'),
    };
  }

  afterEach(() => {
    jest.restoreAllMocks();
    verifyZohoAddress.mockClear();
  });

  it.each([
    [true, clientId, 'verified'],
    [false, clientId, 'failed'],
    [true, 'different-client', 'failed'],
  ])(
    'checks the signed Zoho email and audience (%s, %s)',
    async (verified, audience, result) => {
      const token = jwt.sign(
        { email: 'staff@example.com', email_verified: verified },
        {
          secret: privateKey.export({ type: 'pkcs8', format: 'pem' }),
          algorithm: 'RS256',
          keyid: key.kid,
          issuer,
          audience,
          expiresIn: 60,
        },
      );
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(globalThis.Response.json({ id_token: token }))
        .mockResolvedValueOnce(globalThis.Response.json({ keys: [key] }));

      const { request, response, state } = begin();
      await controller.callback(
        request,
        response as unknown as Response,
        state,
        'code',
        undefined,
      );

      expect(response.redirect).toHaveBeenCalledWith(
        303,
        `${frontend}/verify-email?zoho=${result}`,
      );
      if (result === 'verified')
        expect(verifyZohoAddress).toHaveBeenCalledWith('staff@example.com');
      else expect(verifyZohoAddress).not.toHaveBeenCalled();
    },
  );

  it('rejects a callback without matching browser state before exchanging the code', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch');
    const { request, response } = begin();
    await controller.callback(
      request,
      response as unknown as Response,
      'wrong-state',
      'code',
      undefined,
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(response.redirect).toHaveBeenCalledWith(
      303,
      `${frontend}/verify-email?zoho=failed`,
    );
  });
});

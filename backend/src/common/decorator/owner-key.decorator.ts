import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

// Pulls the connected-account key off the `x-owner-key` header that
// every /leads request now sends (see getOwnerKey()/withOwnerKey() in
// leads.api.js on the frontend, which reads it out of the locally
// stored user).
//
// This is a stand-in for real auth. Once you have a guard that
// authenticates the request and attaches something like
// req.user.ownerKey, swap the body of this decorator to read from
// there instead — the rest of the controller/service won't need to
// change since they just take `ownerKey: string`.
export const OwnerKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers['x-owner-key'];
    const ownerKey = Array.isArray(header) ? header[0] : header;

    if (!ownerKey) {
      throw new UnauthorizedException(
        'Missing x-owner-key header — no Zoho Bigin account selected.',
      );
    }

    return ownerKey;
  },
);

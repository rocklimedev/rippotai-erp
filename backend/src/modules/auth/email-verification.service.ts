import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { randomBytes, createHash } from 'crypto';
import { User } from '../users/models/user.model';
import { VerificationToken } from './models/verification-token.model';
import { AuthToken } from './models/auth-token.model';
import { VerificationTokenType } from '@/common/enums';
import { MailService } from '@/common/mail/mail.service';
import { hasVerifiedEmail } from './verified-email';

const RESPONSE = {
  message: 'If an active account needs verification, an email has been sent.',
};
const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');
const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CODE_LENGTH = 16;
const CODE_EXPIRY_MINUTES = 10;

@Injectable()
export class EmailVerificationService {
  constructor(
    @InjectModel(User) private readonly users: typeof User,
    @InjectModel(VerificationToken)
    private readonly tokens: typeof VerificationToken,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    @InjectModel(AuthToken) private readonly sessions: typeof AuthToken,
  ) {}

  async request(email: string, delivery: 'link' | 'code' = 'link') {
    const user = await this.users.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || user.is_active !== true || hasVerifiedEmail(user))
      return RESPONSE;
    const byCode = delivery === 'code';
    const raw = byCode
      ? Array.from(randomBytes(CODE_LENGTH), (byte) => CODE_ALPHABET[byte & 31]).join('')
      : randomBytes(32).toString('hex');
    const expiresInMinutes = byCode ? CODE_EXPIRY_MINUTES : 24 * 60;
    const token = await this.tokens.create({
      user_id: user.id,
      email: user.email,
      token: hash(raw),
      type: VerificationTokenType.EMAIL_VERIFICATION,
      expires_at: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      used_at: null,
    } as any);
    if (byCode) {
      try {
        await this.mail.sendVerificationCode(user.email, raw, expiresInMinutes);
      } catch {
        // MailService logs delivery failures. Keep the public response uniform.
        await token.update({ used_at: new Date() });
      }
      return RESPONSE;
    }
    const frontend = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    // Fragment prevents the token from reaching HTTP access logs/referrers.
    const url = `${frontend}/verify-email#token=${raw}`;
    await this.mail.sendVerificationEmail(user.email, user.name, url);
    return RESPONSE;
  }

  async requestChange(userId: string, email: string) {
    const normalized = email.trim().toLowerCase();
    await this.sequelize.transaction(async (transaction) => {
      const user = await this.users.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user || user.is_active !== true) {
        throw new BadRequestException('Active account required.');
      }
      if (normalized === user.email) return;
      const existing = await this.users.findOne({
        where: { email: normalized },
        transaction,
      });
      if (existing) throw new ConflictException('Email is already registered');
      const raw = randomBytes(32).toString('hex');
      await user.update({ pending_email: normalized }, { transaction });
      // Replacing a request invalidates every earlier link, even if an address
      // is requested again later.
      await this.tokens.update(
        { used_at: new Date() },
        {
          where: {
            user_id: user.id,
            type: VerificationTokenType.EMAIL_VERIFICATION,
            used_at: null,
          },
          transaction,
        },
      );
      await this.tokens.create(
        {
          user_id: user.id,
          email: normalized,
          token: hash(raw),
          type: VerificationTokenType.EMAIL_VERIFICATION,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
          used_at: null,
        } as any,
        { transaction },
      );
      const frontend = this.config
        .getOrThrow<string>('FRONTEND_URL')
        .replace(/\/$/, '');
      await this.mail.sendVerificationEmail(
        normalized,
        user.name,
        `${frontend}/verify-email#token=${raw}`,
      );
    });
  }

  async verify(raw: string, email?: string) {
    const byCode = raw.length === CODE_LENGTH;
    const address = email?.trim().toLowerCase();
    const invalid = byCode ? 'Verification code is invalid or expired.' : 'Verification link is invalid or expired.';
    if (byCode && !address) throw new BadRequestException(invalid);
    await this.sequelize.transaction(async (transaction) => {
      const token = await this.tokens.findOne({
        where: {
          token: hash(raw),
          type: VerificationTokenType.EMAIL_VERIFICATION,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (
        !token ||
        token.used_at ||
        new Date(token.expires_at).getTime() <= Date.now() ||
        (byCode && token.email !== address)
      ) {
        throw new BadRequestException(invalid);
      }
      const user = await this.users.findByPk(token.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const isEmailChange =
        !byCode && !!user?.pending_email && token.email === user.pending_email;
      if (
        !user ||
        user.is_active !== true ||
        !token.email ||
        (!isEmailChange && (token.email !== user.email || hasVerifiedEmail(user)))
      ) {
        throw new BadRequestException(invalid);
      }
      const now = new Date();
      await user.update(
        {
          ...(isEmailChange ? { email: token.email, pending_email: null } : {}),
          email_verified_at: now,
          email_verified_address: token.email,
        },
        { transaction },
      );
      await token.update({ used_at: now }, { transaction });
      // Previously issued sessions must not become usable after verification.
      await this.sessions.update(
        { revoked_at: now },
        {
          where: { user_id: user.id, revoked_at: null },
          transaction,
        },
      );
    });
    // Verification never activates a disabled account or issues a session.
    return { message: 'Email verified. You can now sign in.' };
  }

  async verifyZohoAddress(email: string): Promise<boolean> {
    const address = email.trim().toLowerCase();
    return this.sequelize.transaction(async (transaction) => {
      const user = await this.users.findOne({
        where: { email: address },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user || user.is_active !== true || user.email.toLowerCase() !== address) {
        return false;
      }
      if (hasVerifiedEmail(user)) return true;

      const now = new Date();
      await user.update(
        { email_verified_at: now, email_verified_address: user.email },
        { transaction },
      );
      await this.sessions.update(
        { revoked_at: now },
        { where: { user_id: user.id, revoked_at: null }, transaction },
      );
      return true;
    });
  }
}

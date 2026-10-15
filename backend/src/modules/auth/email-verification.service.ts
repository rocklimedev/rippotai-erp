import { BadRequestException, Injectable } from '@nestjs/common';
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

  async request(email: string) {
    const user = await this.users.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || user.is_active !== true || hasVerifiedEmail(user))
      return RESPONSE;
    const raw = randomBytes(32).toString('hex');
    await this.tokens.create({
      user_id: user.id,
      email: user.email,
      token: hash(raw),
      type: VerificationTokenType.EMAIL_VERIFICATION,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      used_at: null,
    } as any);
    const frontend = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    // Fragment prevents the token from reaching HTTP access logs/referrers.
    const url = `${frontend}/verify-email#token=${raw}`;
    await this.mail.sendVerificationEmail(user.email, user.name, url);
    return RESPONSE;
  }

  async verify(raw: string) {
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
        new Date(token.expires_at).getTime() <= Date.now()
      ) {
        throw new BadRequestException(
          'Verification link is invalid or expired.',
        );
      }
      const user = await this.users.findByPk(token.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (
        !user ||
        user.is_active !== true ||
        !token.email ||
        token.email !== user.email ||
        hasVerifiedEmail(user)
      ) {
        throw new BadRequestException(
          'Verification link is invalid or expired.',
        );
      }
      const now = new Date();
      await user.update(
        { email_verified_at: now, email_verified_address: token.email },
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
}

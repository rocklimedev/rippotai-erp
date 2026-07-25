import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { Op } from 'sequelize';
import { User } from '../users/models/user.model';
import { PasswordResetToken } from './models/password-reset-token.model';
import { MailService } from '@/common/mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class ForgotPasswordService {
  private readonly logger = new Logger(ForgotPasswordService.name);

  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(PasswordResetToken)
    private readonly passwordResetModel: typeof PasswordResetToken,

    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto): Promise<{
    message: string;
  }> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userModel.findOne({
      where: {
        email,
      },
    });

    /**
     * Never reveal whether the email exists.
     */
    if (!user) {
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      };
    }

    /**
     * Remove previous unused tokens.
     */
    await this.passwordResetModel.destroy({
      where: {
        user_id: user.id,
        used_at: null,
      },
    });

    /**
     * Generate secure token.
     */
    const rawToken = randomBytes(32).toString('hex');

    /**
     * Store only SHA256 hash.
     */
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    /**
     * Expire after 1 hour.
     */
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.passwordResetModel.create({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl,
    );

    this.logger.log(`Password reset email sent to ${user.email}`);

    return {
      message:
        'If an account exists with that email, a password reset link has been sent.',
    };
  }
}

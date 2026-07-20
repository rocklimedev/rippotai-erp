import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly client: BrevoClient;
  private readonly senderEmail: string;
  private readonly senderName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('BREVO_API_KEY');
    const senderEmail = this.config.get<string>('MAIL_FROM');
    const senderName = this.config.get<string>('MAIL_NAME');

    if (!apiKey) {
      throw new Error(
        'BREVO_API_KEY is not set. Cannot initialize MailService.',
      );
    }

    if (!senderEmail) {
      throw new Error('MAIL_FROM is not set. Cannot initialize MailService.');
    }

    this.senderEmail = senderEmail;
    this.senderName = senderName ?? 'Rippotai';

    this.client = new BrevoClient({
      apiKey,
    });
  }

  async send(email: string, subject: string, html: string): Promise<void> {
    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          email: this.senderEmail,
          name: this.senderName,
        },

        to: [
          {
            email,
          },
        ],

        subject,

        htmlContent: html,
      });

      this.logger.log(`Email sent to ${email} — subject: "${subject}"`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${email}: ${error?.message ?? error}`,
        error?.stack,
      );

      throw new Error('Failed to send email. Please try again later.');
    }
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verifyUrl: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial,sans-serif;max-width:480px;margin:auto">

        <h2>Verify your email</h2>

        <p>Hi ${name},</p>

        <p>
          Please confirm your email address to activate your
          INOS RIPPOTAI account.
        </p>

        <p style="margin:24px 0">
          <a href="${verifyUrl}"
             style="
              background:#111;
              color:#fff;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px;
             ">
             Verify Email
          </a>
        </p>

        <p>
          This link expires in 24 hours.
        </p>

      </div>
    `;

    await this.send(email, 'Verify your email address', html);
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">

        <h2>Reset your password</h2>

        <p>Hi ${name},</p>

        <p>
          We received a request to reset your password.
        </p>


        <p style="margin:24px 0">

          <a href="${resetUrl}"
             style="
              background:#111;
              color:#fff;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px;
             ">
             Reset Password
          </a>

        </p>


        <p>
          This link expires in 1 hour.
        </p>

      </div>
    `;

    await this.send(email, 'Reset your password', html);
  }
}

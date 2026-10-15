import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'crypto';

// Approved by the requesting stakeholder on 2026-10-15 for newly set passwords.
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_BYTES = 72; // bcrypt must never silently truncate a new password.

export async function assertNewPassword(password: string): Promise<void> {
  if (
    typeof password !== 'string' ||
    Array.from(password).length < PASSWORD_MIN_LENGTH
  ) {
    throw new BadRequestException(
      `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
    throw new BadRequestException(
      'Password must be no more than 72 UTF-8 bytes.',
    );
  }
  const digest = createHash('sha1')
    .update(password, 'utf8')
    .digest('hex')
    .toUpperCase();
  let breached = false;
  try {
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${digest.slice(0, 5)}`,
      {
        headers: {
          'Add-Padding': 'true',
          'User-Agent': 'Rippotai-ERP-password-policy',
        },
        signal: AbortSignal.timeout(3000),
        redirect: 'error',
      },
    );
    if (response.status !== 200) throw new Error('Screening unavailable');
    const lines = (await response.text()).trim().split(/\r?\n/);
    for (const line of lines) {
      const match = /^([A-F0-9]{35}):(\d+)$/i.exec(line);
      if (!match) throw new Error('Invalid screening response');
      if (match[1].toUpperCase() === digest.slice(5) && Number(match[2]) > 0)
        breached = true;
    }
  } catch {
    // Do not log passwords, full hashes, prefixes, response bodies or errors.
    // Login never calls screening; outages only defer new password writes.
    throw new ServiceUnavailableException(
      'Password safety check is unavailable. Please try again shortly.',
    );
  }
  if (breached)
    throw new BadRequestException(
      'This password has appeared in a data breach. Choose a different password.',
    );
}

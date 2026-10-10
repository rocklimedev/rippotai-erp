import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Explicitly bypass session JWT authentication; rate limiting still applies. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class SecurityThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    // Named budgets otherwise only expose Retry-After-auth-ip.
    context
      .switchToHttp()
      .getResponse()
      .header('Retry-After', detail.timeToBlockExpire);
    return super.throwThrottlingException(context, detail);
  }
}

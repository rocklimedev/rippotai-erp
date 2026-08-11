import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type {
  AutomationContextProvider,
  ContextRequest,
} from '../interfaces/extension-points';
import { AUTOMATION_CONTEXT_PROVIDERS } from '../interfaces/tokens';
import { AutomationExecutionContext } from './automation-context';
import { NotFoundError } from '../errors/automation.errors';

/**
 * Looks up and invokes host-registered `AutomationContextProvider`s by name.
 *
 * This is the ONLY way generic engine components (in particular the Gate
 * Engine — spec §5) may reach outside their own execution context for
 * business data. It never imports a RIPPOTAI service directly; a host
 * application binds an array of `AutomationContextProvider` implementations
 * to the `AUTOMATION_CONTEXT_PROVIDERS` token (see AutomationModule.forRoot),
 * each one internally delegating to a RIPPOTAI adapter/service.
 *
 *   GateEngine -> ContextProviderRegistry -> AutomationContextProvider
 *       (generic)         (generic)              (host-implemented)
 *                                                       |
 *                                                RIPPOTAI Adapter
 *                                                       |
 *                                                RIPPOTAI Service
 */
@Injectable()
export class ContextProviderRegistry {
  private readonly logger = new Logger(ContextProviderRegistry.name);
  private readonly providers = new Map<string, AutomationContextProvider>();

  constructor(
    @Optional()
    @Inject(AUTOMATION_CONTEXT_PROVIDERS)
    injected?: AutomationContextProvider[],
  ) {
    for (const provider of injected ?? []) {
      if (this.providers.has(provider.name)) {
        this.logger.warn(
          `Context provider "${provider.name}" registered more than once; last registration wins`,
        );
      }
      this.providers.set(provider.name, provider);
    }
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  list(): string[] {
    return Array.from(this.providers.keys());
  }

  async resolve(
    context: AutomationExecutionContext,
    request: ContextRequest,
  ): Promise<Record<string, unknown>> {
    const provider = this.providers.get(request.providerName);
    if (!provider) {
      throw new NotFoundError(
        `No AutomationContextProvider registered under name "${request.providerName}"`,
        { providerName: request.providerName },
      );
    }
    return provider.resolve(context, request);
  }

  /** Resolves multiple context requests and merges the results, later requests winning on key collision. */
  async resolveAll(
    context: AutomationExecutionContext,
    requests: ContextRequest[],
  ): Promise<Record<string, unknown>> {
    let merged: Record<string, unknown> = {};
    for (const request of requests) {
      const resolved = await this.resolve(context, request);
      merged = { ...merged, ...resolved };
    }
    return merged;
  }
}

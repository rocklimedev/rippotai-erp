// auth/oauth/interfaces/oauth-provider.interface.ts

/**
 * Common contract for every OAuth-connected provider (Zoho, Google, Microsoft, ...).
 * Each *AuthService (ZohoAuthService, GoogleAuthService, MicrosoftAuthService)
 * implements this so the auth/oauth/*.controller.ts files can stay near-identical
 * and any future provider just has to satisfy this shape.
 */
export interface OAuthProviderService {
  /**
   * Build the provider's consent-screen URL to redirect the user to.
   * @param state Signed, opaque state string (from OAuthStateService.sign) —
   *              never pass a raw userId here.
   * @param scopes Optional override of the provider's default scope list.
   */
  buildAuthorizationUrl(state: string, scopes?: string[]): string;

  /**
   * Exchange the authorization code from the callback for tokens,
   * persist them against the user, and return the stored record.
   * @param code The `code` query param from the provider's redirect.
   * @param userId Resolved from the verified state — not from client input.
   */
  handleOAuthCallback(
    code: string,
    userId: string,
  ): Promise<{ userId: string; scope?: string | null }>;

  /** Whether this user currently has a stored token for this provider. */
  isConnected(userId: string): Promise<boolean>;

  /** Revoke/delete the stored connection for this user. */
  disconnect(userId: string): Promise<void>;
}

/**
 * Optional extension for providers whose downstream API services (Calendar,
 * Tasks, OneDrive, CRM, ...) need a live access token, not just a connect/
 * disconnect lifecycle. Implement this alongside OAuthProviderService when
 * a feature service will call getValidAccessToken() directly.
 */
export interface RefreshableOAuthProviderService extends OAuthProviderService {
  /**
   * Returns a valid access token, transparently refreshing it first if it's
   * expired or about to expire. Throws UnauthorizedException if there's no
   * stored token, or none is possible to obtain (e.g. missing refresh token).
   */
  getValidAccessToken(userId: string): Promise<string>;
}

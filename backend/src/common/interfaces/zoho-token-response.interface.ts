export interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain: string;
  token_type: string;
  expires_in: number; // seconds
  scope?: string;
  error?: string;
}

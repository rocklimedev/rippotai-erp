import { BadRequestException, Injectable } from '@nestjs/common';

import axios, { AxiosRequestConfig, Method } from 'axios';

import { ZohoAuthService } from './zoho-auth.service';

/**
 * Thin, service-agnostic wrapper around axios that:
 *
 * - resolves a valid (auto-refreshed) access token
 * - attaches the Zoho auth header
 * - defaults the base URL to the token's own api_domain
 *
 * Future Zoho product modules (CRM, Books, Mail, Projects, etc.)
 * should use this service instead of talking to axios directly.
 */
@Injectable()
export class ZohoHttpService {
  constructor(private readonly zohoAuthService: ZohoAuthService) {}

  async request<T = any>(
    ownerKey: string,
    method: Method,
    path: string,
    options: AxiosRequestConfig = {},
  ): Promise<T> {
    const token = await this.zohoAuthService.getValidToken(ownerKey);

    /**
     * Priority:
     *
     * 1. Explicit baseURL supplied by the caller
     * 2. apiDomain returned by Zoho during OAuth
     */
    const baseURL = options.baseURL ?? token.apiDomain;

    /**
     * apiDomain is nullable in the database, so make sure
     * we have a valid URL before passing it to Axios.
     */
    if (!baseURL) {
      throw new BadRequestException(
        `Zoho API domain is missing for "${ownerKey}". ` +
          'Please reconnect the Zoho account.',
      );
    }

    const response = await axios.request<T>({
      ...options,
      method,
      url: path,
      baseURL,
      headers: {
        ...options.headers,
        Authorization: `Zoho-oauthtoken ${token.accessToken}`,
      },
    });

    return response.data;
  }

  get<T = any>(ownerKey: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(ownerKey, 'GET', path, options);
  }

  post<T = any>(ownerKey: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(ownerKey, 'POST', path, options);
  }

  put<T = any>(ownerKey: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(ownerKey, 'PUT', path, options);
  }

  delete<T = any>(
    ownerKey: string,
    path: string,
    options?: AxiosRequestConfig,
  ) {
    return this.request<T>(ownerKey, 'DELETE', path, options);
  }
}

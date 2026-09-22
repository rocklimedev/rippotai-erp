import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import axios, { AxiosRequestConfig, Method, AxiosError } from 'axios';
import { ZohoAuthService } from '@/modules/auth/zoho-auth.service';

@Injectable()
export class ZohoHttpService {
  constructor(private readonly zohoAuthService: ZohoAuthService) {}

  async request<T = any>(
    userId: string,
    method: Method,
    path: string,
    options: AxiosRequestConfig = {},
  ): Promise<T> {
    const accessToken = await this.zohoAuthService.getValidAccessToken(userId);

    const baseURL =
      options.baseURL ?? (await this.zohoAuthService.getApiDomain(userId));

    if (!baseURL) {
      throw new BadRequestException(
        `Zoho API domain is missing for this user. ` +
          'Please reconnect the Zoho account.',
      );
    }

    try {
      const response = await axios.request<T>({
        ...options,
        method,
        url: path,
        baseURL,
        headers: {
          ...options.headers,
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      });

      return response.data;
    } catch (err) {
      this.rethrowZohoError(err);
    }
  }

  private rethrowZohoError(err: unknown): never {
    if (!axios.isAxiosError(err)) {
      throw err;
    }

    const axiosErr = err as AxiosError<any>;
    const status = axiosErr.response?.status ?? 500;
    const data = axiosErr.response?.data;

    // Zoho classic: { error: { code, message } }
    // Zoho V3 often: { error_code, message } or similar
    const zohoCode = data?.error?.code ?? data?.error_code ?? data?.code;
    const zohoMessage =
      data?.error?.message ??
      data?.message ??
      data?.error ??
      axiosErr.message ??
      'Zoho API request failed';

    const message =
      typeof zohoMessage === 'string'
        ? zohoMessage
        : JSON.stringify(zohoMessage);

    const body = {
      message,
      zohoCode,
      zohoResponse: data,
      path: axiosErr.config?.url,
      baseURL: axiosErr.config?.baseURL,
    };

    switch (status) {
      case 400:
        throw new BadRequestException(body);
      case 401:
        throw new UnauthorizedException(body);
      case 403:
        throw new ForbiddenException(body);
      case 404:
        throw new NotFoundException(body);
      default:
        if (status >= 400 && status < 500) {
          throw new HttpException(body, status);
        }
        throw new InternalServerErrorException(body);
    }
  }

  get<T = any>(userId: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(userId, 'GET', path, options);
  }

  post<T = any>(userId: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(userId, 'POST', path, options);
  }

  put<T = any>(userId: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(userId, 'PUT', path, options);
  }

  delete<T = any>(userId: string, path: string, options?: AxiosRequestConfig) {
    return this.request<T>(userId, 'DELETE', path, options);
  }
}

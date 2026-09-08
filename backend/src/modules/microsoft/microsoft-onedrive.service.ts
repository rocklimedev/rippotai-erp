// microsoft/services/microsoft-onedrive.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { MicrosoftAuthService } from '../auth/microsoft-auth.service';

const GRAPH_API = 'https://graph.microsoft.com/v1.0';

@Injectable()
export class MicrosoftOneDriveService {
  constructor(private readonly msAuth: MicrosoftAuthService) {}

  /**
   * List files/folders.
   *
   * root:
   *   /
   *
   * Documents:
   *   /Documents
   *
   * Documents/Reports:
   *   /Documents/Reports
   */
  async listFiles(userId: string, folderPath = 'root') {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const path =
      folderPath === 'root'
        ? '/me/drive/root/children'
        : `/me/drive/root:/${this.encodePath(folderPath)}:/children`;

    return this.request(accessToken, path);
  }

  /**
   * Get file/folder metadata.
   */
  async getFileMetadata(userId: string, itemId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/me/drive/items/${encodeURIComponent(itemId)}`,
    );
  }

  /**
   * Upload small file.
   *
   * Recommended for files up to 4 MB.
   */
  async uploadFile(
    userId: string,
    folderPath: string,
    fileName: string,
    content: Buffer,
    contentType = 'application/octet-stream',
  ) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const safeFileName = encodeURIComponent(fileName);

    const path =
      folderPath === 'root'
        ? `/me/drive/root:/${safeFileName}:/content`
        : `/me/drive/root:/${this.encodePath(
            folderPath,
          )}/${safeFileName}:/content`;

    const response = await fetch(`${GRAPH_API}${path}`, {
      method: 'PUT',

      headers: {
        Authorization: `Bearer ${accessToken}`,

        'Content-Type': contentType,
      },

      body: content,
    });

    if (!response.ok) {
      const error = await response.text();

      throw new InternalServerErrorException(
        `OneDrive upload failed: ${error}`,
      );
    }

    return response.json();
  }

  /**
   * Large/resumable upload.
   *
   * Uses 5 MiB chunks.
   *
   * 5 MiB = 16 x 320 KiB
   */
  async uploadLargeFile(
    userId: string,
    folderPath: string,
    fileName: string,
    content: Buffer,
    contentType = 'application/octet-stream',
  ) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const safeFileName = encodeURIComponent(fileName);

    const path =
      folderPath === 'root'
        ? `/me/drive/root:/${safeFileName}:/createUploadSession`
        : `/me/drive/root:/${this.encodePath(
            folderPath,
          )}/${safeFileName}:/createUploadSession`;

    const session = await this.request(accessToken, path, {
      method: 'POST',

      body: JSON.stringify({
        item: {
          '@microsoft.graph.conflictBehavior': 'replace',
        },
      }),
    });

    const uploadUrl = session?.uploadUrl;

    if (!uploadUrl) {
      throw new InternalServerErrorException(
        'Microsoft did not return an upload URL',
      );
    }

    /**
     * Microsoft Graph upload chunks
     * should be multiples of 320 KiB.
     *
     * 5 MiB = 5 * 1024 * 1024
     *       = 16 * 320 KiB
     */
    const CHUNK_SIZE = 5 * 1024 * 1024;

    let start = 0;

    let lastResponse: any = null;

    while (start < content.length) {
      const end = Math.min(start + CHUNK_SIZE, content.length) - 1;

      const chunk = content.subarray(start, end + 1);

      const response = await fetch(uploadUrl, {
        method: 'PUT',

        headers: {
          'Content-Length': String(chunk.length),

          'Content-Range': `bytes ${start}-${end}/${content.length}`,

          'Content-Type': 'application/octet-stream',
        },

        body: chunk,
      });

      if (!response.ok) {
        const error = await response.text();

        throw new InternalServerErrorException(
          `OneDrive chunk upload failed: ${error}`,
        );
      }

      /**
       * Final chunk returns the created
       * driveItem.
       *
       * Intermediate chunks normally return
       * 202 Accepted.
       */
      const responseText = await response.text();

      if (responseText) {
        try {
          lastResponse = JSON.parse(responseText);
        } catch {
          lastResponse = null;
        }
      }

      start = end + 1;
    }

    return lastResponse;
  }

  /**
   * Download file.
   */
  async downloadFile(userId: string, itemId: string): Promise<Buffer> {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const response = await fetch(
      `${GRAPH_API}/me/drive/items/${encodeURIComponent(itemId)}/content`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();

      if (response.status === 404) {
        throw new NotFoundException('OneDrive file not found');
      }

      throw new InternalServerErrorException(
        `OneDrive download failed: ${error}`,
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Delete file.
   */
  async deleteFile(userId: string, itemId: string): Promise<void> {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const response = await fetch(
      `${GRAPH_API}/me/drive/items/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();

      throw new InternalServerErrorException(
        `OneDrive delete failed: ${error}`,
      );
    }
  }

  /**
   * Create folder.
   */
  async createFolder(userId: string, parentPath: string, folderName: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const path =
      parentPath === 'root'
        ? '/me/drive/root/children'
        : `/me/drive/root:/${this.encodePath(parentPath)}:/children`;

    return this.request(accessToken, path, {
      method: 'POST',

      body: JSON.stringify({
        name: folderName,

        folder: {},

        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    });
  }

  /**
   * Get current user's OneDrive.
   */
  async getDrive(userId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(accessToken, '/me/drive');
  }

  /**
   * Generic Graph request.
   */
  private async request(
    accessToken: string,
    path: string,
    init: RequestInit = {},
  ) {
    const response = await fetch(`${GRAPH_API}${path}`, {
      ...init,

      headers: {
        Authorization: `Bearer ${accessToken}`,

        'Content-Type': 'application/json',

        ...init.headers,
      },
    });

    /**
     * DELETE and other successful operations
     * can return 204 with no body.
     */
    if (response.status === 204) {
      return null;
    }

    const text = await response.text();

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Microsoft Graph API error: ${text}`,
      );
    }

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  /**
   * Encode individual path segments while
   * preserving folder separators.
   */
  private encodePath(path: string): string {
    return path
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }
}

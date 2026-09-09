// microsoft/services/microsoft-onedrive.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { MicrosoftAuthService } from '../auth/microsoft-auth.service';

const GRAPH_API = 'https://graph.microsoft.com/v1.0';

@Injectable()
export class MicrosoftOneDriveService {
  private readonly siteId: string;
  private readonly driveId: string;

  constructor(
    private readonly msAuth: MicrosoftAuthService,
    private readonly config: ConfigService,
  ) {
    this.siteId = this.config.get<string>('MICROSOFT_ONEDRIVE_SITE_ID')!;

    this.driveId = this.config.get<string>('MICROSOFT_ONEDRIVE_DRIVE_ID')!;

    if (!this.siteId) {
      throw new Error('MICROSOFT_ONEDRIVE_SITE_ID is not configured');
    }

    if (!this.driveId) {
      throw new Error('MICROSOFT_ONEDRIVE_DRIVE_ID is not configured');
    }
  }

  // ============================================================
  // CENTRAL DRIVE
  // ============================================================

  /**
   * Get the central INOS OneDrive / SharePoint document library.
   *
   * IMPORTANT:
   * This is NOT /me/drive.
   *
   * All INOS users operate against this same drive.
   */
  async getDrive(userId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/drives/${encodeURIComponent(this.driveId)}`,
    );
  }

  // ============================================================
  // LIST FILES
  // ============================================================

  /**
   * List files/folders from the central INOS drive.
   *
   * Root:
   * GET /onedrive/files
   *
   * Folder:
   * GET /onedrive/files?folderPath=Projects
   *
   * Nested:
   * GET /onedrive/files?folderPath=Projects/Project A
   */
  async listFiles(userId: string, folderPath = 'root') {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const path =
      folderPath === 'root'
        ? this.driveRootChildrenPath()
        : this.drivePathChildren(folderPath);

    return this.request(accessToken, path);
  }

  // ============================================================
  // FILE METADATA
  // ============================================================

  /**
   * Get metadata for a file/folder.
   */
  async getFileMetadata(userId: string, itemId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/drives/${encodeURIComponent(
        this.driveId,
      )}/items/${encodeURIComponent(itemId)}`,
    );
  }

  // ============================================================
  // DOWNLOAD
  // ============================================================

  /**
   * Download a file from the central INOS drive.
   */
  async downloadFile(userId: string, itemId: string): Promise<Buffer> {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const response = await fetch(
      `${GRAPH_API}/drives/${encodeURIComponent(
        this.driveId,
      )}/items/${encodeURIComponent(itemId)}/content`,
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

  // ============================================================
  // UPLOAD SMALL FILE
  // ============================================================

  /**
   * Upload a small file.
   *
   * Uses:
   *
   * /drives/{driveId}/root:/path/file:/content
   */
  async uploadFile(
    userId: string,
    folderPath: string,
    fileName: string,
    content: Buffer,
    contentType = 'application/octet-stream',
  ) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const encodedFileName = encodeURIComponent(fileName);

    const path =
      folderPath === 'root'
        ? `/drives/${encodeURIComponent(
            this.driveId,
          )}/root:/${encodedFileName}:/content`
        : `/drives/${encodeURIComponent(this.driveId)}/root:/${this.encodePath(
            folderPath,
          )}/${encodedFileName}:/content`;

    const response = await fetch(`${GRAPH_API}${path}`, {
      method: 'PUT',

      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
        'Content-Length': String(content.length),
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

  // ============================================================
  // LARGE FILE UPLOAD
  // ============================================================

  /**
   * Resumable upload using Microsoft Graph
   * upload sessions.
   */
  async uploadLargeFile(
    userId: string,
    folderPath: string,
    fileName: string,
    content: Buffer,
    contentType = 'application/octet-stream',
  ) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const encodedFileName = encodeURIComponent(fileName);

    const path =
      folderPath === 'root'
        ? `/drives/${encodeURIComponent(
            this.driveId,
          )}/root:/${encodedFileName}:/createUploadSession`
        : `/drives/${encodeURIComponent(this.driveId)}/root:/${this.encodePath(
            folderPath,
          )}/${encodedFileName}:/createUploadSession`;

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
     * Microsoft Graph requires upload chunks
     * to be multiples of 320 KiB.
     *
     * 5 MiB = 16 × 320 KiB.
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

  // ============================================================
  // CREATE FOLDER
  // ============================================================

  /**
   * Create a folder inside the central drive.
   */
  async createFolder(userId: string, parentPath: string, folderName: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const path =
      parentPath === 'root'
        ? this.driveRootChildrenPath()
        : this.drivePathChildren(parentPath);

    return this.request(accessToken, path, {
      method: 'POST',

      body: JSON.stringify({
        name: folderName,

        folder: {},

        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Delete a file or folder from the central drive.
   */
  async deleteFile(userId: string, itemId: string): Promise<void> {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    const response = await fetch(
      `${GRAPH_API}/drives/${encodeURIComponent(
        this.driveId,
      )}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();

      if (response.status === 404) {
        throw new NotFoundException('OneDrive item not found');
      }

      throw new InternalServerErrorException(
        `OneDrive delete failed: ${error}`,
      );
    }
  }

  // ============================================================
  // SEARCH
  // ============================================================

  /**
   * Search files and folders in the central
   * INOS OneDrive.
   *
   * Example:
   *
   * GET /onedrive/search?q=boq
   */
  async search(userId: string, query: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    if (!query?.trim()) {
      return {
        value: [],
      };
    }

    return this.request(
      accessToken,
      `/drives/${encodeURIComponent(
        this.driveId,
      )}/root/search(q='${this.escapeODataString(query.trim())}')`,
    );
  }

  // ============================================================
  // MOVE / RENAME
  // ============================================================

  /**
   * Rename a file/folder.
   */
  async renameFile(userId: string, itemId: string, name: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/drives/${encodeURIComponent(
        this.driveId,
      )}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          name,
        }),
      },
    );
  }

  /**
   * Move an item into another folder.
   */
  async moveFile(userId: string, itemId: string, parentId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/drives/${encodeURIComponent(
        this.driveId,
      )}/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          parentReference: {
            id: parentId,
          },
        }),
      },
    );
  }

  // ============================================================
  // ROOT
  // ============================================================

  /**
   * Get root folder metadata.
   */
  async getRoot(userId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);

    return this.request(
      accessToken,
      `/drives/${encodeURIComponent(this.driveId)}/root`,
    );
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private driveRootChildrenPath() {
    return `/drives/${encodeURIComponent(this.driveId)}/root/children`;
  }

  private drivePathChildren(folderPath: string) {
    return `/drives/${encodeURIComponent(this.driveId)}/root:/${this.encodePath(
      folderPath,
    )}:/children`;
  }

  /**
   * Encode individual path segments while
   * preserving folder separators.
   */
  private encodePath(path: string): string {
    return path
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  /**
   * Escape OData single quotes.
   */
  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  // ============================================================
  // GENERIC GRAPH REQUEST
  // ============================================================

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
}

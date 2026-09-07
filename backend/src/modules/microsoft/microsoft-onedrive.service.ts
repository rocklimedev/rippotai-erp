// microsoft/services/microsoft-onedrive.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MicrosoftAuthService } from '../auth/microsoft-auth.service';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';

@Injectable()
export class MicrosoftOneDriveService {
  constructor(private readonly msAuth: MicrosoftAuthService) {}

  /** List children of a folder. Pass 'root' or a folder path like 'Documents/Reports'. */
  async listFiles(userId: string, folderPath = 'root') {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    const path =
      folderPath === 'root'
        ? '/me/drive/root/children'
        : `/me/drive/root:/${folderPath}:/children`;
    return this.request(accessToken, path);
  }

  async getFileMetadata(userId: string, itemId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    return this.request(accessToken, `/me/drive/items/${itemId}`);
  }

  /** Simple upload — fine up to 4MB. Use uploadLargeFile for anything bigger. */
  async uploadFile(
    userId: string,
    folderPath: string,
    fileName: string,
    content: Buffer,
    contentType = 'application/octet-stream',
  ) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    const path =
      folderPath === 'root'
        ? `/me/drive/root:/${fileName}:/content`
        : `/me/drive/root:/${folderPath}/${fileName}:/content`;

    const res = await fetch(`${GRAPH_API}${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': contentType,
      },
      body: content,
    });
    if (!res.ok)
      throw new InternalServerErrorException(
        `OneDrive upload failed: ${await res.text()}`,
      );
    return res.json();
  }

  /** Resumable upload for files > 4MB. Uploads in 5MB chunks. */
  async uploadLargeFile(
    userId: string,
    folderPath: string,
    fileName: string,
    content: Buffer,
    contentType = 'application/octet-stream',
  ) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    const path =
      folderPath === 'root'
        ? `/me/drive/root:/${fileName}:/createUploadSession`
        : `/me/drive/root:/${folderPath}/${fileName}:/createUploadSession`;

    const session = await this.request(accessToken, path, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const uploadUrl = (session as any).uploadUrl;

    const CHUNK_SIZE = 5 * 1024 * 1024;
    let start = 0;
    let lastResponse: any;

    while (start < content.length) {
      const end = Math.min(start + CHUNK_SIZE, content.length) - 1;
      const chunk = content.subarray(start, end + 1);

      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Length': String(chunk.length),
          'Content-Range': `bytes ${start}-${end}/${content.length}`,
          'Content-Type': contentType,
        },
        body: chunk,
      });
      if (!res.ok)
        throw new InternalServerErrorException(
          `OneDrive chunk upload failed: ${await res.text()}`,
        );
      lastResponse = await res.json();
      start = end + 1;
    }
    return lastResponse;
  }

  async downloadFile(userId: string, itemId: string): Promise<Buffer> {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    const res = await fetch(`${GRAPH_API}/me/drive/items/${itemId}/content`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok)
      throw new InternalServerErrorException(
        `OneDrive download failed: ${await res.text()}`,
      );
    return Buffer.from(await res.arrayBuffer());
  }

  async deleteFile(userId: string, itemId: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    const res = await fetch(`${GRAPH_API}/me/drive/items/${itemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok)
      throw new InternalServerErrorException(
        `OneDrive delete failed: ${await res.text()}`,
      );
  }

  async createFolder(userId: string, parentPath: string, folderName: string) {
    const accessToken = await this.msAuth.getValidAccessToken(userId);
    const path =
      parentPath === 'root'
        ? '/me/drive/root/children'
        : `/me/drive/root:/${parentPath}:/children`;
    return this.request(accessToken, path, {
      method: 'POST',
      body: JSON.stringify({
        name: folderName,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'rename',
      }),
    });
  }

  private async request(
    accessToken: string,
    path: string,
    init: RequestInit = {},
  ) {
    const res = await fetch(`${GRAPH_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });
    if (!res.ok) {
      throw new InternalServerErrorException(
        `Microsoft Graph API error: ${await res.text()}`,
      );
    }
    return res.json();
  }
}

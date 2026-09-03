import { Injectable } from '@nestjs/common';
import FormData from 'form-data';

import { ZohoHttpService } from '../services/zoho-http.service';

const WORKDRIVE_BASE_URL = 'https://www.zohoapis.in';

@Injectable()
export class WorkDriveService {
  constructor(private readonly zohoHttpService: ZohoHttpService) {}

  // ============================================================
  // UPLOAD FILE
  // ============================================================

  /**
   * Upload a file into a WorkDrive folder.
   *
   * Required OAuth scope:
   * WorkDrive.files.CREATE
   *
   * parentId must be the actual WorkDrive folder resource ID,
   * NOT the Private Space ID.
   */
  async uploadFile(
    ownerKey: string,
    parentId: string,
    file: Buffer,
    filename: string,
    overrideNameExist = false,
  ) {
    const form = new FormData();

    form.append('filename', filename);
    form.append('parent_id', parentId);
    form.append('override-name-exist', overrideNameExist ? 'true' : 'false');

    form.append('content', file, {
      filename,
    });

    return this.zohoHttpService.post(ownerKey, '/workdrive/api/v1/upload', {
      baseURL: WORKDRIVE_BASE_URL,
      data: form,
      headers: {
        ...form.getHeaders(),
        Accept: 'application/vnd.api+json',
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  // ============================================================
  // LIST FILES INSIDE FOLDER
  // ============================================================

  /**
   * Get files/folders inside a WorkDrive folder.
   *
   * Required OAuth scope:
   * WorkDrive.files.READ
   */
  async listFiles(ownerKey: string, folderId: string) {
    return this.zohoHttpService.get(
      ownerKey,
      `/workdrive/api/v1/files/${encodeURIComponent(folderId)}/files`,
      {
        baseURL: WORKDRIVE_BASE_URL,
        headers: {
          Accept: 'application/vnd.api+json',
        },
      },
    );
  }

  // ============================================================
  // LIST PRIVATE SPACE FOLDERS
  // ============================================================

  /**
   * Get folders from the user's Private Space.
   *
   * myFolderId is the Private Space ID.
   *
   * The response contains the actual folder resource IDs.
   * Those IDs should be used as upload parent_id.
   *
   * Required OAuth scope:
   * WorkDrive.files.READ
   */
  async listPrivateSpaceFolders(ownerKey: string, myFolderId: string) {
    return this.zohoHttpService.get(
      ownerKey,
      `/workdrive/api/v1/privatespace/${encodeURIComponent(
        myFolderId,
      )}/folders`,
      {
        baseURL: WORKDRIVE_BASE_URL,
        headers: {
          Accept: 'application/vnd.api+json',
        },
      },
    );
  }

  // ============================================================
  // CREATE FOLDER
  // ============================================================

  /**
   * Create a folder inside another WorkDrive folder.
   *
   * Required OAuth scope:
   * WorkDrive.files.CREATE
   */
  async createFolder(ownerKey: string, parentId: string, name: string) {
    return this.zohoHttpService.post(ownerKey, '/workdrive/api/v1/files', {
      baseURL: WORKDRIVE_BASE_URL,
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
      data: {
        data: {
          attributes: {
            name,
            parent_id: parentId,
          },
          type: 'files',
        },
      },
    });
  }

  // ============================================================
  // DELETE / MOVE TO TRASH
  // ============================================================

  /**
   * Move a WorkDrive file/folder to trash.
   *
   * resourceId = WorkDrive resource ID.
   */
  async deleteFile(ownerKey: string, resourceId: string) {
    return this.zohoHttpService.request(
      ownerKey,
      'DELETE' as any,
      '/workdrive/api/v1/files',
      {
        baseURL: WORKDRIVE_BASE_URL,
        headers: {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
        data: {
          data: [
            {
              id: resourceId,
              attributes: {
                status: '51',
              },
            },
          ],
        },
      },
    );
  }
}

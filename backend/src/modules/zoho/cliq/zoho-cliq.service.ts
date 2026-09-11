// src/zoho/cliq/zoho-cliq.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import FormData from 'form-data';
import { createReadStream } from 'fs';

import { ZohoHttpService } from '../services/zoho-http.service';
import { ZohoAuthService } from '@/modules/auth/zoho-auth.service';

const ZOHO_CLIQ_BASE_URL = 'https://cliq.zoho.in/api/v2';
const ZOHO_CLIQ_V3_BASE_URL = 'https://cliq.zoho.in/api/v3';

// ============================================================
// THREAD AGGREGATION LIMITS
// ============================================================
//
// Cliq has no single "all threads I follow" endpoint, so
// listMyThreads() fans out across the user's own chats and
// channels and merges the ones the user is following. These
// caps keep that fan-out inside Cliq's per-minute rate limits.
// ============================================================

const MAX_THREAD_PARENTS = 15;
const MAX_THREAD_PARENT_CONCURRENCY = 5;

/** Shape accepted by upload helpers (Multer file or equivalent). */
export type CliqUploadFile = {
  buffer?: Buffer;
  path?: string;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class ZohoCliqService {
  constructor(
    private readonly zohoHttpService: ZohoHttpService,
    private readonly zohoAuthService: ZohoAuthService,
  ) {}

  // ============================================================
  // STATUS
  // ============================================================

  async getStatus(ownerKey: string) {
    try {
      const accessToken =
        await this.zohoAuthService.getValidAccessToken(ownerKey);

      return {
        connected: Boolean(accessToken),
      };
    } catch {
      return {
        connected: false,
      };
    }
  }

  // ============================================================
  // CHANNELS
  // ============================================================

  async listChannels(ownerKey: string) {
    return this.zohoHttpService.get(ownerKey, '/channels', {
      baseURL: ZOHO_CLIQ_BASE_URL,

      headers: {
        Accept: 'application/json',
      },
    });
  }

  // ============================================================
  // CHATS
  // ============================================================

  async listChats(ownerKey: string) {
    return this.zohoHttpService.get(ownerKey, '/chats', {
      baseURL: ZOHO_CLIQ_BASE_URL,

      headers: {
        Accept: 'application/json',
      },
    });
  }

  // ============================================================
  // CHAT DETAILS
  // ============================================================

  async getChat(ownerKey: string, chatId: string) {
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    return this.zohoHttpService.get(
      ownerKey,
      `/chats/${encodeURIComponent(chatId)}`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        headers: {
          Accept: 'application/json',
        },
      },
    );
  }

  // ============================================================
  // CHAT MESSAGE HISTORY
  // ============================================================

  async getMessages(
    ownerKey: string,
    chatId: string,
    limit = 50,
    fromtime?: number,
  ) {
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 1000);

    const params: Record<string, number> = {
      limit: safeLimit,
    };

    if (
      fromtime !== undefined &&
      fromtime !== null &&
      Number.isFinite(Number(fromtime))
    ) {
      params.fromtime = Number(fromtime);
    }

    return this.zohoHttpService.get(
      ownerKey,
      `/chats/${encodeURIComponent(chatId)}/messages`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        headers: {
          Accept: 'application/json',
        },

        params,
      },
    );
  }

  // ============================================================
  // SEND MESSAGE TO CHAT
  // ============================================================

  async sendMessage(ownerKey: string, chatId: string, text: string) {
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    if (typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException('Message text is required');
    }

    /*
     * IMPORTANT:
     *
     * GET history:
     * /chats/{chatId}/messages
     *
     * POST send:
     * /chats/{chatId}/message
     *
     * Zoho rejects POST /messages.
     */

    return this.zohoHttpService.post(
      ownerKey,
      `/chats/${encodeURIComponent(chatId)}/message`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        headers: {
          Accept: 'application/json',

          'Content-Type': 'application/json',
        },

        data: {
          text: text.trim(),
        },
      },
    );
  }

  // ============================================================
  // SEND MESSAGE TO CHANNEL
  // ============================================================

  async sendChannelMessage(
    ownerKey: string,
    channelUniqueName: string,
    text: string,
  ) {
    if (!channelUniqueName) {
      throw new BadRequestException('Channel unique name is required');
    }

    if (typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException('Message text is required');
    }

    return this.zohoHttpService.post(
      ownerKey,
      `/channelsbyname/${encodeURIComponent(channelUniqueName)}/message`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        headers: {
          Accept: 'application/json',

          'Content-Type': 'application/json',
        },

        data: {
          text: text.trim(),
        },
      },
    );
  }

  // ============================================================
  // MY PINS
  // ============================================================
  //
  // GET /api/v3/pin-categories
  //
  // Returns every chat folder (Zoho calls these "pin categories"),
  // including the default "My Pins" category, along with the
  // chats pinned inside each one.
  // ============================================================

  async getMyPins(ownerKey: string) {
    return this.zohoHttpService.get(ownerKey, '/pin-categories', {
      baseURL: ZOHO_CLIQ_V3_BASE_URL,

      headers: {
        Accept: 'application/json',
      },

      params: {
        include_fields: 'chats,last_message_info,recipients_summary',
      },
    });
  }

  // ============================================================
  // THREADS IN A SPECIFIC CHAT / CHANNEL
  // ============================================================
  //
  // GET /api/v2/chats/{parent_chat_id}/threads
  //
  // Lists the threads that live inside one chat or channel.
  // ============================================================

  async listThreadsForChat(ownerKey: string, parentChatId: string) {
    if (!parentChatId) {
      throw new BadRequestException('parentChatId is required');
    }

    return this.zohoHttpService.get(
      ownerKey,
      `/chats/${encodeURIComponent(parentChatId)}/threads`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        headers: {
          Accept: 'application/json',
        },
      },
    );
  }

  // ============================================================
  // MY THREADS (AGGREGATED, BEST-EFFORT)
  // ============================================================
  //
  // Cliq does not expose a single "all threads I follow" endpoint.
  // We approximate it by:
  //
  //   1. Pulling the user's own chats + channels.
  //   2. Fetching the threads inside each one.
  //   3. Keeping only the threads the user is following
  //      (is_follower === true).
  //
  // This is capped (MAX_THREAD_PARENTS, limited concurrency) to
  // stay well inside Cliq's per-minute rate limits. It is a
  // best-effort view, not a guaranteed-complete one.
  // ============================================================

  async listMyThreads(ownerKey: string) {
    const [chatsResponse, channelsResponse] = await Promise.all([
      this.listChats(ownerKey).catch(() => null),
      this.listChannels(ownerKey).catch(() => null),
    ]);

    const chatParents = this.extractRecords(chatsResponse).map(
      (record: any) => ({
        id: record?.chat_id ?? record?.chatId ?? record?.id,

        name: record?.name ?? record?.title ?? record?.display_name ?? 'Chat',

        parentType: 'chat',
      }),
    );

    const channelParents = this.extractRecords(channelsResponse).map(
      (record: any) => ({
        id: record?.chat_id ?? record?.chatId ?? undefined,

        name:
          record?.title ?? record?.channel_name ?? record?.name ?? 'Channel',

        parentType: 'channel',
      }),
    );

    const parents = [...chatParents, ...channelParents]
      .filter(
        (parent, index, all) =>
          Boolean(parent.id) &&
          all.findIndex((other) => String(other.id) === String(parent.id)) ===
            index,
      )
      .slice(0, MAX_THREAD_PARENTS);

    const threads: any[] = [];

    for (let i = 0; i < parents.length; i += MAX_THREAD_PARENT_CONCURRENCY) {
      const batch = parents.slice(i, i + MAX_THREAD_PARENT_CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (parent) => {
          try {
            const response = await this.listThreadsForChat(
              ownerKey,
              String(parent.id),
            );

            return this.extractRecords(response)
              .filter((thread: any) => thread?.is_follower === true)
              .map((thread: any) => ({
                ...thread,

                parent_chat_id: thread.parent_chat_id ?? String(parent.id),
                parent_name: parent.name,

                parent_type: parent.parentType,
              }));
          } catch {
            return [];
          }
        }),
      );

      threads.push(...batchResults.flat());
    }

    return {
      type: 'chat_thread',

      data: threads,
    };
  }

  // ============================================================
  // PEOPLE (ORGANIZATION DIRECTORY)
  // ============================================================
  //
  // GET /api/v2/users
  // ============================================================

  async listUsers(ownerKey: string, limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

    return this.zohoHttpService.get(ownerKey, '/users', {
      baseURL: ZOHO_CLIQ_BASE_URL,

      headers: {
        Accept: 'application/json',
      },

      params: {
        limit: safeLimit,
      },
    });
  }

  // ============================================================
  // SEND MESSAGE TO A PERSON (BUDDY) DIRECTLY
  // ============================================================
  //
  // POST /api/v2/buddies/{EMAIL_ID}/message
  //
  // Used from the People tab to message someone you don't yet
  // have an open chat with.
  // ============================================================

  async sendBuddyMessage(ownerKey: string, emailId: string, text: string) {
    if (!emailId) {
      throw new BadRequestException('emailId is required');
    }

    if (typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException('Message text is required');
    }

    return this.zohoHttpService.post(
      ownerKey,
      `/buddies/${encodeURIComponent(emailId)}/message`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        headers: {
          Accept: 'application/json',

          'Content-Type': 'application/json',
        },

        data: {
          text: text.trim(),
        },
      },
    );
  }

  // ============================================================
  // FILES — LIST FROM A CHAT (via message history)
  // ============================================================
  //
  // Cliq has no dedicated "list files in chat" endpoint.
  // File shares appear as messages with type "file".
  // We fetch history and normalize file messages for the app.
  // ============================================================

  async listFilesForChat(
    ownerKey: string,
    chatId: string,
    limit = 50,
    fromtime?: number,
  ) {
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    const messagesResponse = await this.getMessages(
      ownerKey,
      chatId,
      limit,
      fromtime,
    );

    const messages = this.extractRecords(messagesResponse);

    const files = messages
      .filter((m: any) => this.isFileMessage(m))
      .map((m: any) => this.normalizeFileMessage(m, chatId));

    return {
      type: 'chat_file',
      data: files,
    };
  }

  // ============================================================
  // FILES — DOWNLOAD BY FILE ID
  // ============================================================
  //
  // GET /api/v2/files/{fileId}
  // Requires ZohoCliq.Attachments.READ
  // Returns binary content (arraybuffer).
  // ============================================================

  async getFile(ownerKey: string, fileId: string) {
    if (!fileId) {
      throw new BadRequestException('fileId is required');
    }

    return this.zohoHttpService.get(
      ownerKey,
      `/files/${encodeURIComponent(fileId)}`,
      {
        baseURL: ZOHO_CLIQ_BASE_URL,

        responseType: 'arraybuffer',

        headers: {
          Accept: '*/*',
        },
      },
    );
  }

  // ============================================================
  // FILES — UPLOAD TO CHAT
  // ============================================================
  //
  // POST /api/v2/chats/{chatId}/files
  // multipart/form-data  field: file  (+ optional comment)
  // ============================================================

  async uploadFileToChat(
    ownerKey: string,
    chatId: string,
    file: CliqUploadFile,
    comment?: string,
  ) {
    if (!chatId) {
      throw new BadRequestException('chatId is required');
    }

    return this.postMultipartFile(
      ownerKey,
      `/chats/${encodeURIComponent(chatId)}/files`,
      file,
      comment,
    );
  }

  // ============================================================
  // FILES — UPLOAD TO CHANNEL
  // ============================================================
  //
  // POST /api/v2/channelsbyname/{uniqueName}/files
  // ============================================================

  async uploadFileToChannel(
    ownerKey: string,
    channelUniqueName: string,
    file: CliqUploadFile,
    comment?: string,
  ) {
    if (!channelUniqueName) {
      throw new BadRequestException('Channel unique name is required');
    }

    return this.postMultipartFile(
      ownerKey,
      `/channelsbyname/${encodeURIComponent(channelUniqueName)}/files`,
      file,
      comment,
    );
  }

  // ============================================================
  // FILES — UPLOAD TO BUDDY (DM BY EMAIL)
  // ============================================================
  //
  // POST /api/v2/buddies/{EMAIL_ID}/files
  // ============================================================

  async uploadFileToBuddy(
    ownerKey: string,
    emailId: string,
    file: CliqUploadFile,
    comment?: string,
  ) {
    if (!emailId) {
      throw new BadRequestException('emailId is required');
    }

    return this.postMultipartFile(
      ownerKey,
      `/buddies/${encodeURIComponent(emailId)}/files`,
      file,
      comment,
    );
  }

  // ============================================================
  // INTERNAL — MULTIPART UPLOAD
  // ============================================================

  private async postMultipartFile(
    ownerKey: string,
    path: string,
    file: CliqUploadFile,
    comment?: string,
  ) {
    if (!file?.buffer && !file?.path) {
      throw new BadRequestException('File is required');
    }

    const form = new FormData();

    const filename = file.originalname || 'upload';
    const contentType = file.mimetype || 'application/octet-stream';

    if (file.buffer) {
      form.append('file', file.buffer, {
        filename,
        contentType,
        knownLength: file.buffer.length,
      });
    } else if (file.path) {
      form.append('file', createReadStream(file.path), {
        filename,
        contentType,
      });
    }

    if (typeof comment === 'string' && comment.trim()) {
      form.append('comment', comment.trim());
    }

    return this.zohoHttpService.post(ownerKey, path, {
      baseURL: ZOHO_CLIQ_BASE_URL,

      // Let form-data set Content-Type + boundary.
      // Do not force application/json here.
      headers: {
        ...form.getHeaders(),
        Accept: 'application/json',
      },

      data: form,

      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  // ============================================================
  // FILE MESSAGE HELPERS
  // ============================================================

  private isFileMessage(message: any): boolean {
    if (!message) {
      return false;
    }

    const type = String(message.type || '').toLowerCase();

    if (type === 'file' || type === 'attachment') {
      return true;
    }

    return Boolean(
      message?.content?.file?.id ||
      message?.file?.id ||
      message?.content?.file?.name,
    );
  }

  private normalizeFileMessage(message: any, chatId: string) {
    const fileMeta =
      message?.content?.file ??
      (typeof message?.file === 'object' ? message.file : {}) ??
      {};

    const fileId = fileMeta?.id ?? null;
    const fileName =
      fileMeta?.name ??
      (typeof message?.file === 'string' ? message.file : null) ??
      'file';

    return {
      message_id: message?.id ?? null,
      time: message?.time ?? null,
      sender: message?.sender ?? null,
      comment: message?.content?.comment ?? message?.comment ?? null,
      chat_id: chatId,

      file: {
        id: fileId,
        name: fileName,
        type: fileMeta?.type ?? null,
        size: fileMeta?.dimensions?.size ?? fileMeta?.size ?? null,
        thumbnail: message?.content?.thumbnail ?? null,
      },

      // Deep link into Cliq web (India DC). Message focus is best-effort.
      cliq_open_url: fileId
        ? `https://cliq.zoho.in/chats/${encodeURIComponent(chatId)}`
        : `https://cliq.zoho.in/chats/${encodeURIComponent(chatId)}`,

      // Your app should expose GET /cliq/files/:fileId that proxies getFile().
      download_path: fileId
        ? `/cliq/files/${encodeURIComponent(String(fileId))}`
        : null,
    };
  }

  // ============================================================
  // RESPONSE HELPERS
  // ============================================================
  //
  // Zoho wraps list responses inconsistently ({data: [...]},
  // {chats: [...]}, a raw array, etc). This mirrors the
  // extraction logic used on the frontend so aggregation
  // (listMyThreads) doesn't need to guess shapes twice.
  // ============================================================

  private extractRecords(response: any): any[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response)) {
      return response;
    }

    const keys = [
      'data',
      'channels',
      'threads',
      'users',
      'pin_categories',
      'chats',
      'messages',
      'items',
      'results',
      'records',
    ];

    for (const key of keys) {
      if (Array.isArray(response?.[key])) {
        return response[key];
      }
    }

    if (
      response?.data &&
      typeof response.data === 'object' &&
      !Array.isArray(response.data)
    ) {
      for (const key of keys) {
        if (Array.isArray(response.data?.[key])) {
          return response.data[key];
        }
      }
    }

    return [];
  }
}

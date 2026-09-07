// src/zoho/cliq/zoho-cliq.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';

import { ZohoHttpService } from '../services/zoho-http.service';
import { ZohoAuthService } from '@/modules/auth/zoho-auth.service';

const ZOHO_CLIQ_BASE_URL = 'https://cliq.zoho.in/api/v2';

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
}

// src/zoho/cliq/zoho-cliq.controller.ts

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { ZohoCliqService } from './zoho-cliq.service';

@Controller('zoho/cliq')
export class ZohoCliqController {
  constructor(private readonly cliqService: ZohoCliqService) {}

  // ============================================================
  // STATUS
  // ============================================================

  @Get(':ownerKey/status')
  getStatus(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.getStatus(ownerKey);
  }

  // ============================================================
  // CHANNELS
  // ============================================================

  @Get(':ownerKey/channels')
  listChannels(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.listChannels(ownerKey);
  }

  // ============================================================
  // CHATS
  // ============================================================

  @Get(':ownerKey/chats')
  listChats(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.listChats(ownerKey);
  }

  // ============================================================
  // CHAT DETAILS
  // ============================================================

  @Get(':ownerKey/chats/:chatId')
  getChat(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
  ) {
    return this.cliqService.getChat(ownerKey, chatId);
  }

  // ============================================================
  // CHAT MESSAGE HISTORY
  // ============================================================
  //
  // GET:
  // /chats/{chatId}/messages
  //
  // This is intentionally plural because this endpoint retrieves
  // the message history.
  // ============================================================

  @Get(':ownerKey/chats/:chatId/messages')
  getMessages(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('fromtime') fromtime?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;

    const parsedFromTime =
      fromtime !== undefined && fromtime !== '' ? Number(fromtime) : undefined;

    return this.cliqService.getMessages(
      ownerKey,
      chatId,
      Number.isFinite(parsedLimit) ? parsedLimit : 50,
      Number.isFinite(parsedFromTime) ? parsedFromTime : undefined,
    );
  }

  // ============================================================
  // SEND MESSAGE TO CHAT
  // ============================================================
  //
  // IMPORTANT:
  //
  // GET history:
  // /chats/{chatId}/messages
  //
  // POST send:
  // /chats/{chatId}/message
  //
  // Do NOT use /messages for POST.
  // ============================================================

  @Post(':ownerKey/chats/:chatId/message')
  sendMessage(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
    @Body('text') text: string,
  ) {
    return this.cliqService.sendMessage(ownerKey, chatId, text);
  }

  // ============================================================
  // SEND MESSAGE TO CHANNEL
  // ============================================================

  @Post(':ownerKey/channels/:channelUniqueName/message')
  sendChannelMessage(
    @Param('ownerKey') ownerKey: string,
    @Param('channelUniqueName') channelUniqueName: string,
    @Body('text') text: string,
  ) {
    return this.cliqService.sendChannelMessage(
      ownerKey,
      channelUniqueName,
      text,
    );
  }
}

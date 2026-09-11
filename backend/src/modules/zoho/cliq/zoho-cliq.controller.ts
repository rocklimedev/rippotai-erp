// src/zoho/cliq/zoho-cliq.controller.ts
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ZohoCliqService } from './zoho-cliq.service';

@Controller('zoho/cliq')
export class ZohoCliqController {
  constructor(private readonly cliqService: ZohoCliqService) {}

  @Get(':ownerKey/status')
  getStatus(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.getStatus(ownerKey);
  }

  @Get(':ownerKey/channels')
  listChannels(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.listChannels(ownerKey);
  }

  @Get(':ownerKey/chats')
  listChats(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.listChats(ownerKey);
  }

  @Get(':ownerKey/chats/:chatId')
  getChat(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
  ) {
    return this.cliqService.getChat(ownerKey, chatId);
  }

  // History uses plural /messages. The frontend also supports fromtime.
  @Get(':ownerKey/chats/:chatId/messages')
  getMessages(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('fromtime') fromtime?: string,
  ) {
    const parsedFromTime =
      fromtime !== undefined && fromtime.trim() !== ''
        ? Number(fromtime)
        : undefined;

    return this.cliqService.getMessages(
      ownerKey,
      chatId,
      this.parseLimit(limit, 50, 1000),
      typeof parsedFromTime === 'number' && Number.isFinite(parsedFromTime)
        ? parsedFromTime
        : undefined,
    );
  }

  // Send uses singular /message with a JSON body: { text: "..." }.
  @Post(':ownerKey/chats/:chatId/message')
  sendMessage(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
    @Body('text') text: string,
  ) {
    return this.cliqService.sendMessage(ownerKey, chatId, text);
  }

  @Get(':ownerKey/chats/:chatId/threads')
  listThreadsForChat(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
  ) {
    return this.cliqService.listThreadsForChat(ownerKey, chatId);
  }

  // channelUniqueName is the channel name used by the service, not its object ID.
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

  @Get(':ownerKey/pins')
  getMyPins(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.getMyPins(ownerKey);
  }

  @Get(':ownerKey/threads')
  listMyThreads(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.listMyThreads(ownerKey);
  }

  @Get(':ownerKey/people')
  listPeople(
    @Param('ownerKey') ownerKey: string,
    @Query('limit') limit?: string,
  ) {
    return this.cliqService.listUsers(
      ownerKey,
      this.parseLimit(limit, 100, 200),
    );
  }

  // The API hook's `email` argument is encoded into this `emailId` route segment.
  @Post(':ownerKey/people/:emailId/message')
  sendPersonMessage(
    @Param('ownerKey') ownerKey: string,
    @Param('emailId') emailId: string,
    @Body('text') text: string,
  ) {
    return this.cliqService.sendBuddyMessage(ownerKey, emailId, text);
  }

  private parseLimit(
    value: string | undefined,
    fallback: number,
    maximum: number,
  ): number {
    if (value === undefined || value.trim() === '') return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(1, Math.trunc(parsed)));
  }
}

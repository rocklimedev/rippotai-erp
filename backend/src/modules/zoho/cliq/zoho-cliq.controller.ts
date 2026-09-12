// src/zoho/cliq/zoho-cliq.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

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
  // CHANNEL MEMBERS
  // ============================================================
  //
  // IMPORTANT:
  // /people -> organization directory
  //
  // /channels/:channelId/members -> actual members of a channel
  //
  // This is important for external Cliq users because an external
  // user from another organization may not appear in /users.
  // ============================================================

  @Get(':ownerKey/channels/:channelId/members')
  listChannelMembers(
    @Param('ownerKey') ownerKey: string,
    @Param('channelId') channelId: string,
  ) {
    return this.cliqService.getChannelMembers(ownerKey, channelId);
  }

  // ============================================================
  // EXTERNAL CHANNEL MEMBERS
  // ============================================================
  //
  // Returns the members participating in the external channel.
  //
  // NOTE:
  // The service uses the channel-members endpoint rather than
  // filtering the organization /users directory.
  // ============================================================

  @Get(':ownerKey/channels/:channelId/members/external')
  listExternalChannelMembers(
    @Param('ownerKey') ownerKey: string,
    @Param('channelId') channelId: string,
  ) {
    return this.cliqService.getExternalChannelMembers(ownerKey, channelId);
  }

  // ============================================================
  // CHANNEL DETAILS + MEMBERS
  // ============================================================
  //
  // Returns:
  //
  // {
  //   channel,
  //   members,
  //   member_count
  // }
  //
  // Useful for INOS project collaboration UI.
  // ============================================================

  @Get(':ownerKey/channels/:channelId/details')
  getChannelWithMembers(
    @Param('ownerKey') ownerKey: string,
    @Param('channelId') channelId: string,
  ) {
    return this.cliqService.getChannelWithMembers(ownerKey, channelId);
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
  // GET /zoho/cliq/:ownerKey/chats/:chatId/messages
  //
  // Query:
  // ?limit=50
  // ?fromtime=123456789
  //
  // History uses plural /messages.
  // ============================================================

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

  // ============================================================
  // SEND MESSAGE TO CHAT
  // ============================================================
  //
  // POST /zoho/cliq/:ownerKey/chats/:chatId/message
  //
  // Body:
  // {
  //   "text": "Hello"
  // }
  //
  // Uses singular /message.
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
  // CHAT THREADS
  // ============================================================

  @Get(':ownerKey/chats/:chatId/threads')
  listThreadsForChat(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
  ) {
    return this.cliqService.listThreadsForChat(ownerKey, chatId);
  }

  // ============================================================
  // FILES IN CHAT
  // ============================================================
  //
  // Files are obtained from message history.
  //
  // GET /zoho/cliq/:ownerKey/chats/:chatId/files
  // ============================================================

  @Get(':ownerKey/chats/:chatId/files')
  listFilesForChat(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: string,
    @Query('fromtime') fromtime?: string,
  ) {
    const parsedFromTime =
      fromtime !== undefined && fromtime.trim() !== ''
        ? Number(fromtime)
        : undefined;

    return this.cliqService.listFilesForChat(
      ownerKey,
      chatId,
      this.parseLimit(limit, 50, 1000),
      typeof parsedFromTime === 'number' && Number.isFinite(parsedFromTime)
        ? parsedFromTime
        : undefined,
    );
  }

  // ============================================================
  // UPLOAD FILE TO CHAT
  // ============================================================
  //
  // POST /zoho/cliq/:ownerKey/chats/:chatId/files
  //
  // multipart/form-data:
  //   file
  //   comment (optional)
  // ============================================================

  @Post(':ownerKey/chats/:chatId/files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFileToChat(
    @Param('ownerKey') ownerKey: string,
    @Param('chatId') chatId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('comment') comment?: string,
  ) {
    return this.cliqService.uploadFileToChat(ownerKey, chatId, file, comment);
  }

  // ============================================================
  // SEND MESSAGE TO CHANNEL
  // ============================================================
  //
  // channelUniqueName is the Cliq channel unique name.
  // It is NOT the channel object ID.
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

  // ============================================================
  // UPLOAD FILE TO CHANNEL
  // ============================================================
  //
  // POST /zoho/cliq/:ownerKey/channels/:channelUniqueName/files
  //
  // multipart/form-data:
  //   file
  //   comment (optional)
  // ============================================================

  @Post(':ownerKey/channels/:channelUniqueName/files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFileToChannel(
    @Param('ownerKey') ownerKey: string,
    @Param('channelUniqueName') channelUniqueName: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('comment') comment?: string,
  ) {
    return this.cliqService.uploadFileToChannel(
      ownerKey,
      channelUniqueName,
      file,
      comment,
    );
  }

  // ============================================================
  // MY PINS
  // ============================================================

  @Get(':ownerKey/pins')
  getMyPins(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.getMyPins(ownerKey);
  }

  // ============================================================
  // MY THREADS
  // ============================================================

  @Get(':ownerKey/threads')
  listMyThreads(@Param('ownerKey') ownerKey: string) {
    return this.cliqService.listMyThreads(ownerKey);
  }

  // ============================================================
  // PEOPLE — ORGANIZATION DIRECTORY
  // ============================================================
  //
  // GET /zoho/cliq/:ownerKey/people
  //
  // IMPORTANT:
  // This is the organization directory only.
  //
  // Do not use this endpoint as the source of truth for external
  // channel members.
  //
  // For channel participants use:
  //
  // GET /:ownerKey/channels/:channelId/members
  // ============================================================

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

  // ============================================================
  // SEND MESSAGE TO PERSON / BUDDY
  // ============================================================
  //
  // The API hook's email argument is encoded into emailId.
  // ============================================================

  @Post(':ownerKey/people/:emailId/message')
  sendPersonMessage(
    @Param('ownerKey') ownerKey: string,
    @Param('emailId') emailId: string,
    @Body('text') text: string,
  ) {
    return this.cliqService.sendBuddyMessage(ownerKey, emailId, text);
  }

  // ============================================================
  // UPLOAD FILE TO PERSON / BUDDY
  // ============================================================
  //
  // POST /zoho/cliq/:ownerKey/people/:emailId/files
  //
  // multipart/form-data:
  //   file
  //   comment (optional)
  // ============================================================

  @Post(':ownerKey/people/:emailId/files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFileToPerson(
    @Param('ownerKey') ownerKey: string,
    @Param('emailId') emailId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('comment') comment?: string,
  ) {
    return this.cliqService.uploadFileToBuddy(ownerKey, emailId, file, comment);
  }

  // ============================================================
  // DOWNLOAD FILE BY FILE ID
  // ============================================================
  //
  // GET /zoho/cliq/:ownerKey/files/:fileId
  //
  // Proxies:
  //
  // GET /api/v2/files/{fileId}
  //
  // as binary content.
  // ============================================================

  @Get(':ownerKey/files/:fileId')
  async downloadFile(
    @Param('ownerKey') ownerKey: string,
    @Param('fileId') fileId: string,
    @Res() res: Response,
    @Query('filename') filename?: string,
  ) {
    const data = await this.cliqService.getFile(ownerKey, fileId);

    // ZohoHttpService may return ArrayBuffer, Buffer,
    // or axios-style response/body.
    const buffer = Buffer.isBuffer(data)
      ? data
      : Buffer.from(data as ArrayBuffer);

    const safeName =
      filename && filename.trim()
        ? filename.trim().replace(/[^\w.\-()+ ]+/g, '_')
        : 'download';

    res.setHeader('Content-Type', 'application/octet-stream');

    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    res.setHeader('Content-Length', String(buffer.length));

    res.send(buffer);
  }

  // ============================================================
  // COMMON QUERY PARAM PARSER
  // ============================================================

  private parseLimit(
    value: string | undefined,
    fallback: number,
    maximum: number,
  ): number {
    if (value === undefined || value.trim() === '') {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(maximum, Math.max(1, Math.trunc(parsed)));
  }
}

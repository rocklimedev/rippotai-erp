import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { SiteRecceService } from './reki.service';

import { CreateSiteRecceDto } from './dto/create-site-recce.dto';
import { UpdateSiteRecceDto } from './dto/update-site-recce.dto';

@Controller('site-recces')
export class SiteRecceController {
  constructor(private readonly siteRecceService: SiteRecceService) {}

  // ============================================================
  // CREATE
  // POST /site-recces
  // ============================================================

  @Post()
  async create(@Body() dto: CreateSiteRecceDto, @Req() req: any) {
    const userId = req.user?.id ?? null;

    return this.siteRecceService.create(dto, userId);
  }

  // ============================================================
  // GET ALL
  // GET /site-recces
  // ============================================================

  @Get()
  async findAll() {
    return this.siteRecceService.findAll();
  }

  // ============================================================
  // GET BY PROJECT
  // GET /site-recces/project/:projectId
  // ============================================================

  @Get('project/:projectId')
  async findByProject(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,
  ) {
    return this.siteRecceService.findByProject(projectId);
  }

  // ============================================================
  // GET ONE
  // GET /site-recces/:id
  // ============================================================

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.siteRecceService.findOne(id);
  }

  // ============================================================
  // UPDATE
  // PATCH /site-recces/:id
  // ============================================================

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe())
    id: string,

    @Body() dto: UpdateSiteRecceDto,

    @Req() req: any,
  ) {
    const userId = req.user?.id ?? null;

    return this.siteRecceService.update(id, dto, userId);
  }

  // ============================================================
  // DELETE
  // DELETE /site-recces/:id
  // ============================================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    await this.siteRecceService.remove(id);
  }

  // ============================================================
  // RESTORE
  // POST /site-recces/:id/restore
  // ============================================================

  @Post(':id/restore')
  async restore(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.siteRecceService.restore(id);
  }

  // ============================================================
  // UPLOAD PHOTO
  //
  // POST
  // /site-recces/:siteRecceId/rooms/:roomId/photos
  //
  // multipart/form-data
  //
  // file
  // shot_number
  // standing_position
  // camera_direction
  // notes
  // ============================================================

  @Post(':siteRecceId/rooms/:roomId/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('siteRecceId', new ParseUUIDPipe())
    siteRecceId: string,

    @Param('roomId', new ParseUUIDPipe())
    roomId: string,

    @UploadedFile() file: Express.Multer.File,

    @Body('shot_number', ParseIntPipe)
    shotNumber: number,

    @Body('standing_position')
    standingPosition?: string,

    @Body('camera_direction')
    cameraDirection?: string,

    @Body('notes')
    notes?: string,
  ) {
    return this.siteRecceService.uploadAndCreatePhoto(
      siteRecceId,
      roomId,
      file,
      shotNumber,
      {
        standing_position: standingPosition,

        camera_direction: cameraDirection,

        notes,
      },
    );
  }

  // ============================================================
  // UPLOAD IMAGE ONLY
  //
  // POST /site-recces/upload
  //
  // Useful when frontend wants CDN URL first
  // and then sends the URL with the recce payload.
  // ============================================================

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.siteRecceService.uploadPhoto(file);
  }

  // ============================================================
  // REPLACE PHOTO
  //
  // PATCH
  // /site-recces/photos/:photoId
  //
  // Uploads new image to CDN,
  // deletes old CDN image,
  // updates database.
  // ============================================================

  @Patch('photos/:photoId')
  @UseInterceptors(FileInterceptor('file'))
  async replacePhoto(
    @Param('photoId', new ParseUUIDPipe())
    photoId: string,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.siteRecceService.replacePhoto(photoId, file);
  }

  // ============================================================
  // UPLOAD / REPLACE LAYOUT IMAGE
  //
  // PATCH
  // /site-recces/photos/:photoId/layout
  // ============================================================

  @Patch('photos/:photoId/layout')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLayoutImage(
    @Param('photoId', new ParseUUIDPipe())
    photoId: string,

    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.siteRecceService.uploadLayoutImage(photoId, file);
  }

  // ============================================================
  // DELETE PHOTO
  //
  // DELETE /site-recces/photos/:photoId
  //
  // Deletes:
  // 1. CDN photo
  // 2. CDN layout image
  // 3. Database record
  // ============================================================

  @Delete('photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePhoto(
    @Param('photoId', new ParseUUIDPipe())
    photoId: string,
  ) {
    await this.siteRecceService.removePhoto(photoId);
  }
}

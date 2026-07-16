import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';

import { SiteRecceService } from './reki.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';

@ApiTags('Site Recce')
@Controller('site-recce')
@UseGuards(JwtAuthGuard)
export class SiteRecceController {
  constructor(private readonly siteRecceService: SiteRecceService) {}

  // ========================================
  // CREATE FULL RECCE WITH FILE UPLOADS
  // ========================================
  @Post()
  @ApiOperation({
    summary:
      'Create a new Site Recce with floors, rooms, layouts & images. ' +
      'Send as multipart/form-data: a "data" field containing the JSON ' +
      'payload, plus "layoutImages" file(s) in the same order as the ' +
      'images referenced across layoutAttachments[].images[].',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recce created successfully',
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'layoutImages', maxCount: 50 }, // Allow multiple images
    ]),
  )
  async create(
    @Body() body: any,
    @UploadedFiles()
    files: { layoutImages?: Express.Multer.File[] },
    @Req() req: any,
  ) {
    // Multipart requests can't carry nested objects/arrays natively, so the
    // frontend sends the non-file payload as a single JSON-encoded 'data'
    // field alongside the raw 'layoutImages' files.
    const createData =
      typeof body?.data === 'string' ? JSON.parse(body.data) : body;

    return this.siteRecceService.createFullRecce(
      createData,
      req.user.id,
      files,
    );
  }

  // ========================================
  // GET ALL RECCES
  // ========================================
  @Get()
  @ApiOperation({ summary: 'Get all Site Recces' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    return this.siteRecceService.findAll(projectId, status);
  }

  // ========================================
  // GET ONE RECCE WITH ALL RELATIONS
  // ========================================
  @Get(':id')
  @ApiOperation({ summary: 'Get Site Recce by ID with all nested data' })
  async findOne(@Param('id') id: string) {
    return this.siteRecceService.findOneWithRelations(id);
  }

  // ========================================
  // UPDATE RECCE
  // ========================================
  @Put(':id')
  @ApiOperation({ summary: 'Update Site Recce basic information' })
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req: any,
  ) {
    return this.siteRecceService.update(id, updateData, req.user.id);
  }

  // ========================================
  // UPDATE STATUS
  // ========================================
  @Put(':id/status')
  @ApiOperation({ summary: 'Update Site Recce status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req: any,
  ) {
    return this.siteRecceService.updateStatus(id, status, req.user.id);
  }

  // ========================================
  // DELETE RECCE
  // ========================================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete Site Recce' })
  async remove(@Param('id') id: string) {
    return this.siteRecceService.remove(id);
  }

  // ========================================
  // ADD FLOOR
  // ========================================
  @Post(':recceId/floors')
  @ApiOperation({ summary: 'Add a new floor to existing recce' })
  async addFloor(@Param('recceId') recceId: string, @Body() floorData: any) {
    return this.siteRecceService.addFloor(recceId, floorData);
  }

  // ========================================
  // ADD ROOM
  // ========================================
  @Post('floors/:floorId/rooms')
  @ApiOperation({ summary: 'Add a new room to a floor' })
  async addRoom(@Param('floorId') floorId: string, @Body() roomData: any) {
    return this.siteRecceService.addRoom(floorId, roomData);
  }

  // ========================================
  // ADD LAYOUT ATTACHMENT
  // ========================================
  @Post(':recceId/layouts')
  @ApiOperation({ summary: 'Add layout attachment' })
  async addLayoutAttachment(
    @Param('recceId') recceId: string,
    @Body() layoutData: any,
    @Req() req: any,
  ) {
    return this.siteRecceService.addLayoutAttachment(
      recceId,
      layoutData,
      req.user.id,
    );
  }
}

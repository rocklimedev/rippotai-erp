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
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

@ApiTags('Site Recce')
@Controller('site-recce')
@UseGuards(JwtAuthGuard)
export class SiteRecceController {
  constructor(private readonly siteRecceService: SiteRecceService) {}

  // ========================================
  // CREATE FULL RECCE (with files)
  // ========================================
  @Post()
  @ApiOperation({
    summary:
      'Create a new Site Recce with floors, rooms, layouts & images. ' +
      'Send as multipart/form-data: a "data" field containing the JSON ' +
      'payload, plus "layoutImages" file(s).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recce created successfully',
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'layoutImages', maxCount: 50 }]),
  )
  async create(
    @Body() body: any,
    @UploadedFiles()
    files: { layoutImages?: Express.Multer.File[] },
    @CurrentUser() user: User,
  ) {
    const createData =
      typeof body?.data === 'string' ? JSON.parse(body.data) : body;

    return this.siteRecceService.createFullRecce(createData, user.id, files);
  }

  // ========================================
  // GET ALL
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
  // GET ONE (with full relations)
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
    @CurrentUser() user: User,
  ) {
    return this.siteRecceService.update(id, updateData, user.id);
  }

  // ========================================
  // UPDATE STATUS
  // ========================================
  @Put(':id/status')
  @ApiOperation({ summary: 'Update Site Recce status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: User,
  ) {
    return this.siteRecceService.updateStatus(id, status, user.id);
  }

  // ========================================
  // DELETE RECCE
  // ========================================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete Site Recce' })
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.siteRecceService.remove(id, user.id);
  }

  // ========================================
  // HELPER ROUTES
  // ========================================
  @Post(':recceId/floors')
  @ApiOperation({ summary: 'Add a new floor to existing recce' })
  async addFloor(@Param('recceId') recceId: string, @Body() floorData: any) {
    return this.siteRecceService.addFloor(recceId, floorData);
  }

  @Post('floors/:floorId/rooms')
  @ApiOperation({ summary: 'Add a new room to a floor' })
  async addRoom(@Param('floorId') floorId: string, @Body() roomData: any) {
    return this.siteRecceService.addRoom(floorId, roomData);
  }

  @Post(':recceId/layouts')
  @ApiOperation({ summary: 'Add layout attachment' })
  async addLayoutAttachment(
    @Param('recceId') recceId: string,
    @Body() layoutData: any,
    @CurrentUser() user: User,
  ) {
    return this.siteRecceService.addLayoutAttachment(
      recceId,
      layoutData,
      user.id,
    );
  }
}

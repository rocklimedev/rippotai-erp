import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkDriveService } from './workdrive.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('zoho/workdrive')
export class WorkDriveController {
  constructor(private readonly workDriveService: WorkDriveService) {}

  @RequirePermission('zoho-workdrive:upload')
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadFileDto) {
    return this.workDriveService.uploadFile(
      dto.ownerKey,
      dto.parentId,
      file.buffer,
      file.originalname,
      dto.overrideNameExist === 'true',
    );
  }

  @RequirePermission('zoho-workdrive:read')
  @Get('folders/:folderId/files')
  async listFiles(@Param('folderId') folderId: string, @Query('ownerKey') ownerKey: string) {
    return this.workDriveService.listFiles(ownerKey, folderId);
  }

  @RequirePermission('zoho-workdrive:create')
  @Post('folders')
  async createFolder(
    @Body('ownerKey') ownerKey: string,
    @Body('parentId') parentId: string,
    @Body('name') name: string,
  ) {
    return this.workDriveService.createFolder(ownerKey, parentId, name);
  }
}

import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CdnGuard } from '@/common/guards/cdn.guard';
import { CdnService } from './cdn.service';

@Controller('cdn')
export class CdnController {
  constructor(private readonly cdnService: CdnService) {}

  @Post('upload')
  @UseGuards(CdnGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 500 * 1024 * 1024,
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.cdnService.uploadFile(file);
  }
}

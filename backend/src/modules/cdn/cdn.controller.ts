import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DiskUploadInterceptor, UploadRateGuard } from './upload-security';
import { CdnGuard } from '@/common/guards/cdn.guard';
import { CdnService } from './cdn.service';
import { Public } from '@/common/decorator/public.decorator';
import { verifyFileAccess } from './file-access';
import type { Response } from 'express';

@Controller('cdn')
export class CdnController {
  constructor(private readonly cdnService: CdnService) {}

  // Independently authenticated by a short-lived HMAC capability, not JWT.
  @Public()
  @RequirePermission('file-link:read')
  @Get('private/:key')
  async privateFile(
    @Param('key') key: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res() res: Response,
  ) {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    verifyFileAccess(key, expires, signature);
    try {
      res.setHeader('Content-Disposition', `inline; filename="${key}"`);
      res.type(key);
      await this.cdnService.streamFile(key, res);
    } catch (error) {
      if (
        (error as NodeJS.ErrnoException).code === 'ENOENT' ||
        (error as { code?: number }).code === 2
      ) {
        return res.status(404).send({ message: 'File not found' });
      }
      throw error;
    }
  }

  @RequirePermission('cdn:upload')
  @Post('upload')
  @UseGuards(CdnGuard, UploadRateGuard)
  @UseInterceptors(DiskUploadInterceptor)
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.cdnService.uploadFile(file);
  }
}

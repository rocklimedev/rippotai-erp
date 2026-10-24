import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NasTestService } from './nas-test.service';
import { DiskUploadInterceptor, UploadRateGuard } from './upload-security';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { NasService } from './nas.service';
import { NasStagingService } from './nas-staging.service';
import { NasTransferService } from './nas-transfer.service';

@Controller('nas')
export class NasController {
  constructor(
    private readonly nas: NasService,
    private readonly staging: NasStagingService,
    private readonly transfers: NasTransferService,
    private readonly tests: NasTestService,
  ) {}

  @Post('test/upload')
  @RequirePermission('settings:update')
  @UseGuards(UploadRateGuard)
  @UseInterceptors(DiskUploadInterceptor)
  @Header('Cache-Control', 'no-store')
  uploadTest(
    @UploadedFile() file: Express.Multer.File,
    @Body('scope') scope: string,
  ) {
    return this.tests.upload(file, scope);
  }

  @Post('test/copy')
  @RequirePermission('settings:update')
  @UseGuards(UploadRateGuard)
  @Header('Cache-Control', 'no-store')
  copyTest(@Body('url') url: unknown) {
    return this.tests.copy(url);
  }

  @Get('status')
  @Header('Cache-Control', 'no-store')
  @RequirePermission('settings:read')
  async status() {
    const [nas, staging] = await Promise.all([
      this.nas.status(),
      this.staging.status(),
    ]);
    return { ...nas, staging, transfers: this.transfers.status() };
  }
}

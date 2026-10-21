import { Controller, Get, Header } from '@nestjs/common';
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
  ) {}

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

import { Module } from '@nestjs/common';
import { CdnController } from './cdn.controller';
import { CdnService } from './cdn.service';
import { NasService } from './nas.service';
import { NasController } from './nas.controller';
import { NasStagingService } from './nas-staging.service';
import { NasTransferService } from './nas-transfer.service';

@Module({
  controllers: [CdnController, NasController],
  providers: [CdnService, NasService, NasStagingService, NasTransferService],
  exports: [CdnService],
})
export class CdnModule {}

import { Module } from '@nestjs/common';
import { CdnController } from './cdn.controller';
import { CdnService } from './cdn.service';
import { NasService } from './nas.service';
import { NasController } from './nas.controller';
import { NasStagingService } from './nas-staging.service';
import { NasTransferService } from './nas-transfer.service';
import { NasTestService } from './nas-test.service';

@Module({
  controllers: [CdnController, NasController],
  providers: [
    CdnService,
    NasService,
    NasStagingService,
    NasTransferService,
    NasTestService,
  ],
  exports: [CdnService],
})
export class CdnModule {}

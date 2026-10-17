import { Global, Module } from '@nestjs/common';
import { CdnModule } from '../cdn/cdn.module';
import { ExportJobsController } from './export-jobs.controller';
import { ExportJobsService } from './export-jobs.service';
import { ExportJobInterceptor } from './async-export.decorator';

@Global()
@Module({
  imports: [CdnModule],
  controllers: [ExportJobsController],
  providers: [ExportJobsService, ExportJobInterceptor],
  exports: [ExportJobsService, ExportJobInterceptor],
})
export class ExportJobsModule {}

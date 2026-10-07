import { Controller, Get, Global, Module, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { SharedProjectDataService } from './shared-project-data.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
class SharedProjectDataController {
  constructor(private readonly shared: SharedProjectDataService) {}

  @Get(':id/shared-document-data')
  fetch(@Param('id', ParseUUIDPipe) id: string) {
    return this.shared.fetch(id);
  }

  @Get(':id/document-prefill/:sequence')
  prefill(@Param('id', ParseUUIDPipe) id: string, @Param('sequence') sequence: string) {
    return this.shared.prefill(id, sequence);
  }
}

@Global()
@Module({ controllers: [SharedProjectDataController], providers: [SharedProjectDataService], exports: [SharedProjectDataService] })
export class SharedProjectDataModule {}

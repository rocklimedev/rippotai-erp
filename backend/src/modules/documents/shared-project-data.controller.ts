import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../../common/decorator/require-permission.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth-guard';
import { SharedProjectDataService } from './shared-project-data.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class SharedProjectDataController {
  constructor(private readonly shared: SharedProjectDataService) {}

  @RequirePermission('projects:read')
  @Get(':id/shared-document-data')
  fetch(@Param('id', ParseUUIDPipe) id: string) {
    return this.shared.fetch(id);
  }

  @RequirePermission('projects:read')
  @Get(':id/document-prefill/:sequence')
  prefill(@Param('id', ParseUUIDPipe) id: string, @Param('sequence') sequence: string) {
    return this.shared.prefill(id, sequence);
  }
}

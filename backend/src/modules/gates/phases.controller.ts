import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { PhasesService } from './phases.service';

@ApiTags('phases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('phase-definitions')
export class PhasesController {
  constructor(private readonly phasesService: PhasesService) {}

  @Get()
  @ApiOperation({
    summary:
      'The 9 phases + 2 parallel tracks from the Master Process Brain, in display order.',
  })
  list() {
    return this.phasesService.listAll();
  }
}

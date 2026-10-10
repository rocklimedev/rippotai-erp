import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GateService } from './gate.service';
import { LogGateDto } from './dto/tracking.dto';

@Controller('gates')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @RequirePermission('gates:create')
  @Post()
  logGate(@Body() dto: LogGateDto) {
    return this.gateService.logGate(dto);
  }

  @RequirePermission('gates:read')
  @Get('projects/:projectId/history')
  getHistory(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.gateService.getGateHistory(projectId);
  }

  @RequirePermission('gates:read')
  @Get('projects/:projectId/checklist')
  getChecklist(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.gateService.getGateChecklist(projectId);
  }
}

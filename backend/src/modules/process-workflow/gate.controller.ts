import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { GateService } from './gate.service';
import { LogGateDto } from './dto/tracking.dto';

@Controller('gates')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Post()
  logGate(@Body() dto: LogGateDto) {
    return this.gateService.logGate(dto);
  }

  @Get('projects/:projectId/history')
  getHistory(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.gateService.getGateHistory(projectId);
  }

  @Get('projects/:projectId/checklist')
  getChecklist(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.gateService.getGateChecklist(projectId);
  }
}

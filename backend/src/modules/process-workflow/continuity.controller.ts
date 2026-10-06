import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ContinuityService } from './continuity.service';
import { CreateContinuityRoleDto } from './dto/tracking.dto';

@Controller('workflow')
export class ContinuityController {
  constructor(private readonly continuityService: ContinuityService) {}

  @Post('continuity-roles')
  createRole(@Body() dto: CreateContinuityRoleDto) {
    return this.continuityService.createRole(dto);
  }

  @Post('continuity-roles/:id/open')
  markOpened(@Param('id', ParseUUIDPipe) id: string) {
    return this.continuityService.markOpened(id);
  }

  @Post('continuity-roles/:id/close')
  markClosed(@Param('id', ParseUUIDPipe) id: string) {
    return this.continuityService.markClosed(id);
  }

  @Get('projects/:projectId/continuity-roles')
  getRoleMap(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.continuityService.getProjectRoleMap(projectId);
  }
}

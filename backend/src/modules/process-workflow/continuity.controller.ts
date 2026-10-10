import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ContinuityService } from './continuity.service';
import { CreateContinuityRoleDto } from './dto/tracking.dto';

@Controller('workflow')
export class ContinuityController {
  constructor(private readonly continuityService: ContinuityService) {}

  @RequirePermission('workflow:create')
  @Post('continuity-roles')
  createRole(@Body() dto: CreateContinuityRoleDto) {
    return this.continuityService.createRole(dto);
  }

  @RequirePermission('workflow:update')
  @Post('continuity-roles/:id/open')
  markOpened(@Param('id', ParseIntPipe) id: number) {
    return this.continuityService.markOpened(id);
  }

  @RequirePermission('workflow:update')
  @Post('continuity-roles/:id/close')
  markClosed(@Param('id', ParseIntPipe) id: number) {
    return this.continuityService.markClosed(id);
  }

  @RequirePermission('workflow:read')
  @Get('projects/:projectId/continuity-roles')
  getRoleMap(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.continuityService.getProjectRoleMap(projectId);
  }
}

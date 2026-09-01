import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import type { CurrentUserPayload } from '@/common/interfaces/current-user-payload.interface';

import { GateEngineService } from './gate-engine.service';
import { ClearGateDto } from './dto/clear-gate.dto';
import { ReopenGateDto } from './dto/reopen-gate.dto';
import { TickConditionDto } from './dto/tick-condition.dto';

@ApiTags('gates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects/:projectId/gates')
export class GatesController {
  constructor(private readonly gateEngine: GateEngineService) {}

  @Get()
  @RequirePermission('gates:read')
  @ApiOperation({
    summary:
      'List all 12 gates for a project with their current status, in sequence.',
  })
  list(@Param('projectId') projectId: string) {
    return this.gateEngine.listProjectGates(projectId);
  }

  @Get(':gateCode')
  @RequirePermission('gates:read')
  @ApiOperation({
    summary:
      'Dry-run readiness check for a single gate — every condition and whether it currently passes.',
  })
  check(
    @Param('projectId') projectId: string,
    @Param('gateCode') gateCode: string,
  ) {
    return this.gateEngine.checkReadiness(projectId, gateCode);
  }

  @Post(':gateCode/clear')
  @RequirePermission('gates:clear')
  @ApiOperation({
    summary:
      'Clear a gate. Fails if a required condition is unmet or the previous gate is not yet cleared.',
  })
  clear(
    @Param('projectId') projectId: string,
    @Param('gateCode') gateCode: string,
    @Body() dto: ClearGateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.gateEngine.clearGate(projectId, gateCode, user, dto);
  }

  @Post(':gateCode/reopen')
  @RequirePermission('gates:reopen')
  @ApiOperation({
    summary:
      'Reopen a cleared gate, cascading every downstream cleared gate back to LOCKED.',
  })
  async reopen(
    @Param('projectId') projectId: string,
    @Param('gateCode') gateCode: string,
    @Body() dto: ReopenGateDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.gateEngine.reopenGate(projectId, gateCode, user, dto.remarks);
    return { reopened: true, gateCode };
  }

  @Post('conditions/:conditionId/tick')
  @RequirePermission('gates:clear')
  @ApiOperation({
    summary:
      'Manually tick (or untick) a MANUAL_APPROVAL condition that has no automated signal.',
  })
  async tick(
    @Param('projectId') projectId: string,
    @Param('conditionId') conditionId: string,
    @Body() dto: TickConditionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    await this.gateEngine.tickManualCondition(
      projectId,
      conditionId,
      user,
      dto.ticked,
      dto.remarks,
    );
    return { conditionId, ticked: dto.ticked };
  }
}

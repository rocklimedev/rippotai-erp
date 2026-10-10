import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateStepProgressDto, SignOffStepDto } from './dto/tracking.dto';

@Controller(':projectId/progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @RequirePermission('workflow-progress:create')
  @Post('init')
  init(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.progressService.initializeProjectProgress(projectId);
  }

  @RequirePermission('workflow-progress:read')
  @Get()
  getProjectProgress(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.progressService.getProjectProgress(projectId);
  }

  @RequirePermission('workflow-progress:update')
  @Patch('steps/:stepId')
  updateStepProgress(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Body() dto: UpdateStepProgressDto,
  ) {
    return this.progressService.updateStepProgress(projectId, stepId, dto);
  }

  @RequirePermission('workflow-progress:sign-off')
  @Post('steps/:stepId/sign-off')
  signOff(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('stepId', ParseIntPipe) stepId: number,
    @Body() dto: SignOffStepDto,
  ) {
    return this.progressService.signOffStep(projectId, stepId, dto);
  }
}

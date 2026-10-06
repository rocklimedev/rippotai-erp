import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { UpdateStepProgressDto, SignOffStepDto } from './dto/tracking.dto';

@Controller(':projectId/progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('init')
  init(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.progressService.initializeProjectProgress(projectId);
  }

  @Get()
  getProjectProgress(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.progressService.getProjectProgress(projectId);
  }

  @Patch('steps/:stepId')
  updateStepProgress(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateStepProgressDto,
  ) {
    return this.progressService.updateStepProgress(projectId, stepId, dto);
  }

  @Post('steps/:stepId/sign-off')
  signOff(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: SignOffStepDto,
  ) {
    return this.progressService.signOffStep(projectId, stepId, dto);
  }
}

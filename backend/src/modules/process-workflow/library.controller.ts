import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { LibraryService } from './library.service';
import {
  CreatePhaseDto,
  UpdatePhaseDto,
  CreateStepDto,
  UpdateStepDto,
  CreateDeliverableDto,
  AssignStepTeamDto,
} from './dto/library.dto';
import { TrackType } from '../../common/enums/process-workflow.enums';

@Controller('workflow/library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // Phases
  @RequirePermission('workflow-library:create')
  @Post('phases')
  createPhase(@Body() dto: CreatePhaseDto) {
    return this.libraryService.createPhase(dto);
  }

  @RequirePermission('workflow-library:update')
  @Patch('phases/:id')
  updatePhase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePhaseDto,
  ) {
    return this.libraryService.updatePhase(id, dto);
  }

  /** GET /workflow/library?trackType=MAIN — the full process brain, grouped by track. */
  @RequirePermission('workflow-library:read')
  @Get()
  getFullLibrary(@Query('trackType') trackType?: TrackType) {
    return this.libraryService.getFullLibrary(trackType);
  }

  // Steps
  @RequirePermission('workflow-library:create')
  @Post('steps')
  createStep(@Body() dto: CreateStepDto) {
    return this.libraryService.createStep(dto);
  }

  @RequirePermission('workflow-library:update')
  @Patch('steps/:id')
  updateStep(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStepDto,
  ) {
    return this.libraryService.updateStep(id, dto);
  }

  @RequirePermission('workflow-library:read')
  @Get('steps/:id')
  getStep(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.getStepOrThrow(id);
  }

  @RequirePermission('workflow-library:read')
  @Get('gates')
  listGateSteps() {
    return this.libraryService.listGateSteps();
  }

  // Deliverable catalogue
  @RequirePermission('workflow-library:deliver')
  @Post('deliverables')
  addDeliverable(@Body() dto: CreateDeliverableDto) {
    return this.libraryService.addDeliverable(dto);
  }

  @RequirePermission('workflow-library:read')
  @Get('steps/:id/deliverables')
  listDeliverables(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.listDeliverablesForStep(id);
  }

  // Team responsibility mapping
  @RequirePermission('workflow-library:assign')
  @Post('step-teams')
  assignTeam(@Body() dto: AssignStepTeamDto) {
    return this.libraryService.assignTeamToStep(dto);
  }

  @RequirePermission('workflow-library:delete')
  @Delete('step-teams/:id')
  removeTeam(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.removeTeamFromStep(id);
  }

  @RequirePermission('workflow-library:read')
  @Get('steps/:id/teams')
  listTeamsForStep(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.listTeamsForStep(id);
  }

  @RequirePermission('workflow-library:read')
  @Get('teams/:id/steps')
  listStepsForTeam(@Param('id', ParseIntPipe) id: number) {
    return this.libraryService.listStepsForTeam(id);
  }
}

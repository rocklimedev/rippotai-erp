import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
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

  @Get('teams')
  listTeams() {
    return this.libraryService.listTeams();
  }

  // Phases
  @Post('phases')
  createPhase(@Body() dto: CreatePhaseDto) {
    return this.libraryService.createPhase(dto);
  }

  @Patch('phases/:id')
  updatePhase(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePhaseDto,
  ) {
    return this.libraryService.updatePhase(id, dto);
  }

  /** GET /workflow/library?trackType=MAIN — the full process brain, grouped by track. */
  @Get()
  getFullLibrary(@Query('trackType') trackType?: TrackType) {
    return this.libraryService.getFullLibrary(trackType);
  }

  // Steps
  @Post('steps')
  createStep(@Body() dto: CreateStepDto) {
    return this.libraryService.createStep(dto);
  }

  @Patch('steps/:id')
  updateStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.libraryService.updateStep(id, dto);
  }

  @Get('steps/:id')
  getStep(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.getStepOrThrow(id);
  }

  @Get('gates')
  listGateSteps() {
    return this.libraryService.listGateSteps();
  }

  // Deliverable catalogue
  @Post('deliverables')
  addDeliverable(@Body() dto: CreateDeliverableDto) {
    return this.libraryService.addDeliverable(dto);
  }

  @Get('steps/:id/deliverables')
  listDeliverables(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.listDeliverablesForStep(id);
  }

  // Team responsibility mapping
  @Post('step-teams')
  assignTeam(@Body() dto: AssignStepTeamDto) {
    return this.libraryService.assignTeamToStep(dto);
  }

  @Delete('step-teams/:id')
  removeTeam(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.removeTeamFromStep(id);
  }

  @Get('steps/:id/teams')
  listTeamsForStep(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.listTeamsForStep(id);
  }

  @Get('teams/:id/steps')
  listStepsForTeam(@Param('id', ParseUUIDPipe) id: string) {
    return this.libraryService.listStepsForTeam(id);
  }
}

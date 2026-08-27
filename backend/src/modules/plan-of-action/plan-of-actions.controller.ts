import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PlanOfActionsService } from './plan-of-actions.service';
import { CreatePlanOfActionDto } from './dto/create-plan-of-action.dto';
import { UpdatePlanOfActionDto } from './dto/update-plan-of-action.dto';
import { UpsertPhaseDto } from './dto/upsert-phase.dto';
import { ApplyTermsDto } from '../metas/dto/apply-terms.dto';

// Team endpoints are NOT duplicated here — use the shared team module:
//   GET/POST/PUT /team/PLAN_OF_ACTION/:planOfActionId
@Controller('plan-of-actions')
export class PlanOfActionsController {
  constructor(private readonly planOfActionsService: PlanOfActionsService) {}

  @Get()
  findAll(@Query('project_id') projectId?: string) {
    if (projectId) {
      return this.planOfActionsService.findByProject(projectId);
    }

    return this.planOfActionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreatePlanOfActionDto) {
    return this.planOfActionsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.planOfActionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlanOfActionDto,
  ) {
    return this.planOfActionsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.planOfActionsService.remove(id);
  }

  @Put(':id/phases')
  replacePhases(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() phases: UpsertPhaseDto[],
  ) {
    return this.planOfActionsService.replacePhases(id, phases);
  }

  @Put(':id/terms')
  applyTerms(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApplyTermsDto,
  ) {
    return this.planOfActionsService.applyTerms(id, dto);
  }

  @Post(':id/publish')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.planOfActionsService.publish(id);
  }
}

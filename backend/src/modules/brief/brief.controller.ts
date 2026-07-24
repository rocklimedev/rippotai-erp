import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';

import { BriefService } from './brief.service';
import { CreateProjectBriefDto } from './dto/create-project-brief.dto';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

// Matches endpoint="/documents/forms/project-brief" from ProjectBriefForm
@Controller('documents/forms/project-brief')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post()
  create(@Body() dto: CreateProjectBriefDto, @CurrentUser() user: User) {
    return this.briefService.create(dto, user);
  }

  // GET /documents/forms/project-brief?project_id=...
  @Get()
  findAll(@Query('project_id') project_id?: string) {
    return this.briefService.findAll({ project_id });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.briefService.findOne(id);
  }
}

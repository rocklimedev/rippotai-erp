import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { BriefService } from './brief.service';
import { CreateProjectBriefDto } from './dto/create-project-brief.dto';

// Matches endpoint="/documents/forms/project-brief" from ProjectBriefForm
@Controller('documents/forms/project-brief')
export class BriefController {
  constructor(private readonly briefService: BriefService) {}

  @Post()
  create(@Body() dto: CreateProjectBriefDto) {
    return this.briefService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.briefService.findOne(id);
  }
}

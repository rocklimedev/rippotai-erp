import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectHandoversService } from './project-handovers.service';
import { CreateProjectHandoverDto } from './dto/create-project-handover.dto';
import { UpdateProjectHandoverDto } from './dto/update-project-handover.dto';
import { SignOffProjectHandoverDto } from './dto/sign-off-project-handover.dto';

@Controller('project-handovers')
export class ProjectHandoversController {
  constructor(
    private readonly projectHandoversService: ProjectHandoversService,
  ) {}

  @Post()
  create(@Body() dto: CreateProjectHandoverDto) {
    return this.projectHandoversService.create(dto);
  }

  @Get()
  findAll() {
    return this.projectHandoversService.findAll();
  }

  @Get('by-project/:projectId')
  findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.projectHandoversService.findByProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectHandoversService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectHandoverDto,
  ) {
    return this.projectHandoversService.update(id, dto);
  }

  @Patch(':id/sign-off')
  signOff(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignOffProjectHandoverDto,
  ) {
    return this.projectHandoversService.signOff(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.projectHandoversService.remove(id);
  }
}

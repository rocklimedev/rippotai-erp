import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkPackagesService } from './work-packages.service';
import { CreateWorkPackageDto } from './dto/create-work-package.dto';
import { UpdateWorkPackageDto } from './dto/update-work-package.dto';

@Controller('projects/work-packages')
export class WorkPackagesController {
  constructor(private readonly workPackagesService: WorkPackagesService) {}

  @Post()
  create(@Body() dto: CreateWorkPackageDto) {
    return this.workPackagesService.create(dto);
  }

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.workPackagesService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workPackagesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkPackageDto,
  ) {
    return this.workPackagesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workPackagesService.remove(id);
  }
}

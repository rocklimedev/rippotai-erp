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
import { DesignClarificationsService } from './design-clarifications.service';
import { CreateDesignClarificationDto } from './dto/create-design-clarification.dto';
import { UpdateDesignClarificationDto } from './dto/update-design-clarification.dto';
import { RespondDesignClarificationDto } from './dto/respond-design-clarification.dto';
import { DesignClarificationStatus } from './models/design-clarification.model';

@Controller('design-clarifications')
export class DesignClarificationsController {
  constructor(
    private readonly designClarificationsService: DesignClarificationsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDesignClarificationDto) {
    return this.designClarificationsService.create(dto);
  }

  @Get()
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: DesignClarificationStatus,
  ) {
    return this.designClarificationsService.findAll(projectId, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.designClarificationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDesignClarificationDto,
  ) {
    return this.designClarificationsService.update(id, dto);
  }

  @Patch(':id/respond')
  respond(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RespondDesignClarificationDto,
  ) {
    return this.designClarificationsService.respond(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.designClarificationsService.remove(id);
  }
}

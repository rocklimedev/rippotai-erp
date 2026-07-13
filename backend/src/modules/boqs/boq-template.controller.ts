import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';
import { BoqTemplateService } from './boq-template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/create-boq-template.dto';

@UseGuards(JwtAuthGuard)
@Controller('boq/templates')
export class BoqTemplateController {
  constructor(private readonly templateService: BoqTemplateService) {}

  @Get()
  findAll() {
    return this.templateService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templateService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user?: User) {
    return this.templateService.create(dto, user?.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user?: User,
  ) {
    return this.templateService.update(id, dto, user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.templateService.remove(id, user?.id);
  }
}

/**
 * Compatibility controller for legacy frontend DELETE calls.
 * TODO: Update frontend to use `/boq/templates/:id` and remove this.
 */
@UseGuards(JwtAuthGuard)
@Controller('boq-templates')
export class BoqTemplateCompatController {
  constructor(private readonly templateService: BoqTemplateService) {}

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.templateService.remove(id, user?.id);
  }
}

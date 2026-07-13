import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';

import { BoqService } from './boq.service';
import { CreateBoqDto } from './dto/create-boq.dto';
import { UpdateBoqDto } from './dto/update-boq.dto';
import {
  CreateBoqCategoryDto,
  UpdateBoqCategoryDto,
} from './dto/create-boq-category.dto';
import { CreateBoqItemDto, UpdateBoqItemDto } from './dto/create-boq-item.dto';

@UseGuards(JwtAuthGuard)
@Controller('boqs')
export class BoqController {
  constructor(private readonly boqService: BoqService) {}

  @Get()
  findAll(@Query('project_id') projectId?: string) {
    return this.boqService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.boqService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBoqDto, @CurrentUser() user?: User) {
    return this.boqService.create(dto, user?.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBoqDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.update(id, dto, user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.boqService.remove(id, user?.id);
  }

  // ---------- Categories ----------

  @Post(':id/categories')
  addCategory(
    @Param('id') boqId: string,
    @Body() dto: CreateBoqCategoryDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.addCategory(boqId, dto, user?.id);
  }

  @Patch(':id/categories/:categoryId')
  updateCategory(
    @Param('id') boqId: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateBoqCategoryDto,
  ) {
    return this.boqService.updateCategory(boqId, categoryId, dto);
  }

  @Delete(':id/categories/:categoryId')
  removeCategory(
    @Param('id') boqId: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.removeCategory(boqId, categoryId, user?.id);
  }

  // ---------- Line items ----------

  @Post(':id/items')
  addItem(
    @Param('id') boqId: string,
    @Body() dto: CreateBoqItemDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.addItem(boqId, dto, user?.id);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') boqId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBoqItemDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.updateItem(boqId, itemId, dto, user?.id);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id') boqId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.removeItem(boqId, itemId, user?.id);
  }
}

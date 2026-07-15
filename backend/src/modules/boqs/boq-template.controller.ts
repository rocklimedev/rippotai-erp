// boq-template.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BoqTemplateService } from './boq-template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
} from './dto/create-boq-template.dto';
// import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'; // adjust to your auth setup

@Controller('boq/templates')
// @UseGuards(JwtAuthGuard)
export class BoqTemplateController {
  constructor(private readonly templates: BoqTemplateService) {}

  @Get()
  findAll() {
    return this.templates.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templates.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    return this.templates.create(dto, req.user?.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: any,
  ) {
    return this.templates.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.templates.remove(id, req.user?.id);
  }

  // ---- Categories ----

  @Post(':id/categories')
  addCategory(@Param('id') id: string, @Body('name') name: string) {
    return this.templates.addCategory(id, name);
  }

  @Delete(':id/categories/:categoryId')
  deleteCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.templates.deleteCategory(id, categoryId);
  }

  // ---- Items ----

  @Post(':id/categories/:categoryId/items')
  addItem(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() body: any,
  ) {
    return this.templates.addItem(id, categoryId, body);
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    return this.templates.updateItem(id, itemId, body);
  }

  @Delete(':id/items/:itemId')
  deleteItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.templates.deleteItem(id, itemId);
  }

  @Post(':id/items/reorder')
  reorderItems(
    @Param('id') id: string,
    @Body() body: { category_id: string; ordered_ids: string[] },
  ) {
    return this.templates.reorderItems(id, body.category_id, body.ordered_ids);
  }
}

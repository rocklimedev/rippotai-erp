import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { Response } from 'express';
import { BoqService } from './boq.service';
import { BoqExportService, PdfVariant } from './boq-export.service';
import { CreateBoqDto } from './dto/create-boq.dto';
import { UpdateBoqDto } from './dto/update-boq.dto';
import {
  CreateBoqCategoryDto,
  UpdateBoqCategoryDto,
} from './dto/create-boq-category.dto';
import { CreateBoqItemDto, UpdateBoqItemDto } from './dto/create-boq-item.dto';
import { CreateBoqMiscellaneousDto } from './dto/create-boq-miscellaneous.dto';
import { UpdateBoqMiscellaneousDto } from './dto/update-boq-miscellaneous.dto';
import { ReorderMiscellaneousDto } from './dto/reorder-miscellaneous.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { BulkUpdateItemsDto } from './dto/bulk-update-items.dto';
import {
  ApproveBoqDto,
  DuplicateVersionDto,
  SubmitForApprovalDto,
} from './dto/boq-workflow.dto';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { User } from '@/modules/users/models/user.model';
import { BoqDashboardService } from './boq-dashboard.service';
import { ApplyTermsDto } from '../metas/dto/apply-terms.dto';

const PDF_VARIANTS: readonly PdfVariant[] = [
  'internal',
  'client',
  'quantity_only',
  'vendor_enquiry',
];

function parsePdfVariant(value: string | undefined): PdfVariant {
  if (!value) return 'internal';
  if ((PDF_VARIANTS as readonly string[]).includes(value)) {
    return value as PdfVariant;
  }
  throw new BadRequestException(
    `Invalid variant "${value}". Expected one of: ${PDF_VARIANTS.join(', ')}`,
  );
}

@Controller('boqs')
export class BoqController {
  constructor(
    private readonly boqService: BoqService,
    private readonly exportService: BoqExportService,
    private readonly dashboardService: BoqDashboardService,
  ) {}

  // ==================== DASHBOARD (static routes first) ====================
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('productivity')
  getProductivity() {
    return this.dashboardService.getProductivity();
  }

  @Get('project-wise')
  getProjectWise() {
    return this.dashboardService.getProjectWise();
  }

  @Get('value-trend')
  getValueTrend(@Query('months') months?: string) {
    return this.dashboardService.getValueTrend(months ? Number(months) : 6);
  }

  @Get('monthly-volume')
  getMonthlyVolume(@Query('months') months?: string) {
    return this.dashboardService.getMonthlyVolume(months ? Number(months) : 6);
  }

  @Get('status-mix')
  getStatusMix() {
    return this.dashboardService.getStatusMix();
  }

  @Get('recently-edited')
  getRecentlyEdited(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentlyEdited(limit ? Number(limit) : 5);
  }

  // ==================== LIST & CRUD ====================
  @Get()
  findAll(@Query('project_id') projectId?: string) {
    return this.boqService.findAll(projectId);
  }

  // ==================== VERSION & WORKFLOW ROUTES (more specific first) ====================

  // Version history
  @Get(':id/versions')
  getVersionHistory(@Param('id') id: string) {
    return this.boqService.getVersionHistory(id);
  }

  // Compare versions
  @Get(':id/compare')
  compare(@Param('id') id: string, @Query('vs') vs: string) {
    if (!vs) {
      throw new BadRequestException('vs query param is required');
    }
    return this.boqService.compareVersions(id, vs);
  }

  @Post('combine')
  async combine(@Body() dto: { boqIds: string[]; title?: string }, @Req() req) {
    return this.boqService.combineBoqs(dto, req.user?.id);
  }
  // Rename version (global versionId route)
  @Patch('versions/:versionId')
  renameVersion(
    @Param('versionId') versionId: string,
    @Body('version_name') versionName: string,
  ) {
    if (!versionName?.trim()) {
      throw new BadRequestException('version_name is required');
    }
    return this.boqService.renameVersion(versionId, versionName);
  }

  // Workflow
  @Post(':id/submit-for-approval')
  submitForApproval(
    @Param('id') id: string,
    @Body() dto: SubmitForApprovalDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.submitForApproval(id, dto, user?.id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveBoqDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.approve(id, dto, user?.id);
  }

  @Post(':id/duplicate-version')
  duplicateVersion(
    @Param('id') id: string,
    @Body() dto: DuplicateVersionDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.duplicateVersion(id, dto, user?.id);
  }

  @Post(':id/new-version')
  newVersion(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.boqService.newVersion(id, user?.id);
  }

  // ==================== SINGLE BOQ CRUD (general :id route — keep near the end) ====================
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

  // ==================== CATEGORIES & ITEMS ====================
  @Post(':id/categories')
  addCategory(
    @Param('id') id: string,
    @Body()
    dto: CreateBoqCategoryDto & {
      catalog_code?: string;
      include_items?: boolean;
    },
    @CurrentUser() user?: User,
  ) {
    return this.boqService.addCategory(id, dto, user?.id);
  }

  @Patch(':id/terms')
  applyTerms(
    @Param('id') id: string,
    @Body() dto: ApplyTermsDto,
    @Req() req: any,
  ) {
    return this.boqService.applyTerms(id, dto, req.user?.id);
  }
  @Patch(':id/categories/:categoryId')
  updateCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateBoqCategoryDto,
  ) {
    return this.boqService.updateCategory(id, categoryId, dto);
  }

  @Delete(':id/categories/:categoryId')
  removeCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.removeCategory(id, categoryId, user?.id);
  }

  @Post(':id/categories/:categoryId/items')
  addItem(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: Omit<CreateBoqItemDto, 'boq_category_id'>,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.addItem(
      id,
      { ...dto, boq_category_id: categoryId },
      user?.id,
    );
  }

  @Patch(':id/items/:itemId')
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateBoqItemDto & { hidden?: boolean },
    @CurrentUser() user?: User,
  ) {
    return this.boqService.updateItem(id, itemId, dto, user?.id);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.removeItem(id, itemId, user?.id);
  }

  @Post(':id/items/reorder')
  reorderItems(
    @Param('id') id: string,
    @Body() dto: ReorderItemsDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.reorderItems(id, dto, user?.id);
  }

  @Post(':id/items/bulk')
  bulkUpdateItems(
    @Param('id') id: string,
    @Body() dto: BulkUpdateItemsDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.bulkUpdateItems(id, dto, user?.id);
  }

  // ==================== MISCELLANEOUS ====================
  // Free-form named financial entries (e.g. "Contingency", "Mobilization
  // charge") that don't fit the category/item structure. Their sum is
  // exposed as misc_amount on the BOQ payload — see
  // BoqService.withComputedTotals.

  // NOTE: registered after '/items/*' and before the reorder route so
  // ':miscId' below never shadows a more specific path.
  @Post(':id/miscellaneous')
  addMiscellaneous(
    @Param('id') id: string,
    @Body() dto: CreateBoqMiscellaneousDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.addMiscellaneous(id, dto, user?.id);
  }

  @Post(':id/miscellaneous/reorder')
  reorderMiscellaneous(
    @Param('id') id: string,
    @Body() dto: ReorderMiscellaneousDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.reorderMiscellaneous(id, dto.ordered_ids, user?.id);
  }

  @Patch(':id/miscellaneous/:miscId')
  updateMiscellaneous(
    @Param('id') id: string,
    @Param('miscId') miscId: string,
    @Body() dto: UpdateBoqMiscellaneousDto,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.updateMiscellaneous(id, miscId, dto, user?.id);
  }

  @Delete(':id/miscellaneous/:miscId')
  removeMiscellaneous(
    @Param('id') id: string,
    @Param('miscId') miscId: string,
    @CurrentUser() user?: User,
  ) {
    return this.boqService.removeMiscellaneous(id, miscId, user?.id);
  }

  // ==================== EXPORT ====================
  @Get(':id/export/excel')
  async exportExcel(@Param('id') id: string, @Res() res: Response) {
    const { buffer, filename } = await this.exportService.toExcel(id);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @Post(':id/export/pdf')
  async exportPdf(
    @Param('id') id: string,
    @Body('variant') variant: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.exportService.toPdf(
      id,
      parsePdfVariant(variant),
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(buffer);
  }

  @Post(':id/export/pdf-thumbnail')
  async exportPdfThumbnail(
    @Param('id') id: string,
    @Query('variant') variant: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.pageOneThumbnail(
      id,
      parsePdfVariant(variant),
    );
    res.set({ 'Content-Type': 'image/png' });
    res.send(buffer);
  }
}

// Catalog Controller (unchanged — it's correctly separated)
@Controller('boq-catalog')
export class BoqCatalogController {
  constructor(private readonly boqService: BoqService) {}

  @Get()
  getCatalog() {
    return this.boqService.getCatalog();
  }
}

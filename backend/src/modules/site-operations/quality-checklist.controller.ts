import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseEnumPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QualityChecklistService } from './quality-checklist.service';
import {
  CreateQualityChecklistDto,
  UpdateQualityChecklistDto,
  CreateQualityChecklistItemDto,
  UpdateQualityChecklistItemDto,
  FilterQualityChecklistDto,
  FilterChecklistItemDto,
  BulkUpdateChecklistItemsDto,
  QualityChecklistResponseDto,
  QualityChecklistItemResponseDto,
  PaginatedQualityChecklistDto,
  ChecklistSummaryDto,
  CreateQualityChecklistFromTemplateDto,
} from './dto/quality-checklist.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { CheckpointPhase } from './models/quality-checklist-item.model';
import { WorkHead } from '@/common/enums/quality-checklist.enums';

@Controller('quality-checklists')
@UseGuards(JwtAuthGuard)
export class QualityChecklistController {
  constructor(
    private readonly qualityChecklistService: QualityChecklistService,
  ) {}

  /**
   * Create a new quality checklist
   * POST /quality-checklists
   */
  @RequirePermission('quality-checklists:create')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createChecklist(
    @Body() createChecklistDto: CreateQualityChecklistDto,
    @CurrentUser() user: any,
  ): Promise<QualityChecklistResponseDto> {
    return this.qualityChecklistService.createChecklist(
      createChecklistDto,
      user.id,
    );
  }

  /**
   * List work-head templates that have detailed checkpoints
   * GET /quality-checklists/templates
   * Source: QUALITY CHECK LIST.xlsx detailed sheets
   */
  @RequirePermission('quality-checklists:read')
  @Get('templates')
  listWorkHeadTemplates() {
    return this.qualityChecklistService.listWorkHeadTemplates();
  }

  @RequirePermission('quality-checklists:read')
  @Get()
  listChecklists(@Query() filter: FilterQualityChecklistDto) {
    return this.qualityChecklistService.getChecklists(filter);
  }

  /**
   * Get checkpoint template for one work head
   * GET /quality-checklists/templates/:workHead
   */
  @RequirePermission('quality-checklists:read')
  @Get('templates/:workHead')
  getWorkHeadTemplate(
    @Param('workHead', new ParseEnumPipe(WorkHead)) workHead: WorkHead,
  ) {
    return this.qualityChecklistService.getWorkHeadTemplate(workHead);
  }

  /**
   * Create a project checklist from a work-head template
   * POST /quality-checklists/from-template
   * Body: { project_id, work_head, description? }
   */
  @RequirePermission('quality-checklists:create')
  @Post('from-template')
  @HttpCode(HttpStatus.CREATED)
  async createFromWorkHead(
    @Body() body: CreateQualityChecklistFromTemplateDto,
    @CurrentUser() user: any,
  ): Promise<QualityChecklistResponseDto> {
    return this.qualityChecklistService.createFromWorkHead(
      body.project_id,
      body.work_head,
      user.id,
      body.description,
    );
  }

  /**
   * Get checklist by ID
   * GET /quality-checklists/:id
   */
  @RequirePermission('quality-checklists:read')
  @Get(':id')
  async getChecklistById(
    @Param('id') id: string,
  ): Promise<QualityChecklistResponseDto> {
    return this.qualityChecklistService.getChecklistById(id);
  }

  /**
   * Get all checklists for a project
   * GET /quality-checklists/project/:projectId
   */
  @RequirePermission('quality-checklists:read')
  @Get('project/:projectId')
  async getChecklistsByProject(
    @Param('projectId') projectId: string,
    @Query() filter: FilterQualityChecklistDto,
  ): Promise<PaginatedQualityChecklistDto> {
    filter.project_id = projectId;
    return this.qualityChecklistService.getChecklistsByProject(
      projectId,
      filter,
    );
  }

  /**
   * Update checklist
   * PUT /quality-checklists/:id
   */
  @RequirePermission('quality-checklists:update')
  @Put(':id')
  async updateChecklist(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateQualityChecklistDto,
    @CurrentUser() user: any,
  ): Promise<QualityChecklistResponseDto> {
    return this.qualityChecklistService.updateChecklist(
      id,
      updateChecklistDto,
      user.id,
    );
  }

  /**
   * Delete checklist
   * DELETE /quality-checklists/:id
   */
  @RequirePermission('quality-checklists:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChecklist(@Param('id') id: string): Promise<void> {
    return this.qualityChecklistService.deleteChecklist(id);
  }

  /**
   * Mark checklist as complete
   * PUT /quality-checklists/:id/complete
   */
  @RequirePermission('quality-checklists:update')
  @Put(':id/complete')
  async completeChecklist(
    @Param('id') id: string,
  ): Promise<QualityChecklistResponseDto> {
    return this.qualityChecklistService.completeChecklist(id);
  }

  /**
   * Get checklist summary/statistics
   * GET /quality-checklists/:id/summary
   */
  @RequirePermission('quality-checklists:read')
  @Get(':id/summary')
  async getChecklistSummary(
    @Param('id') id: string,
  ): Promise<ChecklistSummaryDto> {
    return this.qualityChecklistService.getChecklistSummary(id);
  }

  /**
   * Export checklist data
   * GET /quality-checklists/:id/export
   */
  @RequirePermission('quality-checklists:export')
  @Get(':id/export')
  async exportChecklistData(@Param('id') id: string): Promise<any> {
    return this.qualityChecklistService.exportChecklistData(id);
  }

  /**
   * Add item to checklist
   * POST /quality-checklists/:checklistId/items
   */
  @RequirePermission('quality-checklists:create')
  @Post(':checklistId/items')
  @HttpCode(HttpStatus.CREATED)
  async addChecklistItem(
    @Param('checklistId') checklistId: string,
    @Body() createItemDto: CreateQualityChecklistItemDto,
    @CurrentUser() user: any,
  ): Promise<QualityChecklistItemResponseDto> {
    return this.qualityChecklistService.addChecklistItem(
      checklistId,
      createItemDto,
      user.id,
    );
  }

  /**
   * Get all items in a checklist
   * GET /quality-checklists/:checklistId/items
   */
  @RequirePermission('quality-checklists:read')
  @Get(':checklistId/items')
  async getChecklistItems(
    @Param('checklistId') checklistId: string,
    @Query() filter: FilterChecklistItemDto,
  ): Promise<any> {
    filter.checklist_id = checklistId;
    return this.qualityChecklistService.getChecklistItems(filter);
  }

  /**
   * Get items by phase
   * GET /quality-checklists/:checklistId/items/phase/:phase
   */
  @RequirePermission('quality-checklists:read')
  @Get(':checklistId/items/phase/:phase')
  async getItemsByPhase(
    @Param('checklistId') checklistId: string,
    @Param('phase', new ParseEnumPipe(CheckpointPhase)) phase: CheckpointPhase,
  ): Promise<QualityChecklistItemResponseDto[]> {
    return this.qualityChecklistService.getItemsByPhase(checklistId, phase);
  }

  /**
   * Update checklist item
   * PUT /quality-checklists/items/:itemId
   */
  // Static bulk route must precede the item-ID route.
  @RequirePermission('quality-checklists:update')
  @Put('items/bulk-update')
  async bulkUpdateChecklistItems(
    @Body() bulkUpdateDto: BulkUpdateChecklistItemsDto,
    @CurrentUser() user: any,
  ): Promise<QualityChecklistItemResponseDto[]> {
    return this.qualityChecklistService.bulkUpdateChecklistItems(
      bulkUpdateDto,
      user.id,
    );
  }

  @RequirePermission('quality-checklists:export')
  @Get('project/:projectId/export-workbook')
  exportProjectWorkbook(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.qualityChecklistService.exportProjectWorkbook(projectId);
  }

  @RequirePermission('quality-checklists:update')
  @Put('items/:itemId')
  async updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateQualityChecklistItemDto,
    @CurrentUser() user: any,
  ): Promise<QualityChecklistItemResponseDto> {
    return this.qualityChecklistService.updateChecklistItem(
      itemId,
      updateItemDto,
      user.id,
    );
  }

  /**
   * Delete checklist item
   * DELETE /quality-checklists/items/:itemId
   */
  @RequirePermission('quality-checklists:delete')
  @Delete('items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteChecklistItem(@Param('itemId') itemId: string): Promise<void> {
    return this.qualityChecklistService.deleteChecklistItem(itemId);
  }
}

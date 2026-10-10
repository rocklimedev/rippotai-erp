import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ScopeOfWorkService } from './scope-of-work.service';

import { CreateScopeCategoryDto } from './dto/create-scope-category.dto';
import { UpdateScopeCategoryDto } from './dto/update-scope-category.dto';

import { CreateProjectSpaceDto } from './dto/create-project-space.dto';
import { UpdateProjectSpaceDto } from './dto/update-project-space.dto';

import { CreateProjectScopeCategoryDto } from './dto/create-project-scope-category.dto';

import { CreateScopeItemDto } from './dto/create-scope-item.dto';
import { UpdateScopeItemDto } from './dto/update-scope-item.dto';

import { CreateScopeOfWorkDto } from './dto/create-scope-of-work.dto';
import { UpdateScopeOfWorkDto } from './dto/update-scope-of-work.dto';
import { CreateCompleteScopeOfWorkDto } from './dto/create-complete-scope-of-work.dto';
@Controller('scope-of-work')
export class ScopeOfWorkController {
  constructor(private readonly scopeOfWorkService: ScopeOfWorkService) {}

  // ============================================================
  // SCOPE CATEGORIES
  // ============================================================

  @RequirePermission('scope-of-work:create')
  @Post('categories')
  createCategory(@Body() dto: CreateScopeCategoryDto) {
    return this.scopeOfWorkService.createCategory(dto);
  }

  @RequirePermission('scope-of-work:read')
  @Get('categories')
  getCategories() {
    return this.scopeOfWorkService.findAllCategories();
  }

  @RequirePermission('scope-of-work:read')
  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.scopeOfWorkService.findCategoryById(id);
  }

  @RequirePermission('scope-of-work:update')
  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateScopeCategoryDto) {
    return this.scopeOfWorkService.updateCategory(id, dto);
  }

  @RequirePermission('scope-of-work:delete')
  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteCategory(id);
  }

  // ============================================================
  // PROJECT SPACES
  // ============================================================

  @RequirePermission('scope-of-work:create')
  @Post('projects/:projectId/spaces')
  createProjectSpace(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectSpaceDto,
  ) {
    return this.scopeOfWorkService.createProjectSpace(projectId, dto);
  }

  @RequirePermission('scope-of-work:read')
  @Get('projects/:projectId/spaces')
  getProjectSpaces(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getProjectSpaces(projectId);
  }

  @RequirePermission('scope-of-work:read')
  @Get('spaces/:id')
  getProjectSpace(@Param('id') id: string) {
    return this.scopeOfWorkService.getProjectSpaceById(id);
  }

  @RequirePermission('scope-of-work:update')
  @Patch('spaces/:id')
  updateProjectSpace(
    @Param('id') id: string,
    @Body() dto: UpdateProjectSpaceDto,
  ) {
    return this.scopeOfWorkService.updateProjectSpace(id, dto);
  }

  @RequirePermission('scope-of-work:delete')
  @Delete('spaces/:id')
  deleteProjectSpace(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteProjectSpace(id);
  }

  // ============================================================
  // PROJECT SCOPE CATEGORIES
  // ============================================================

  @RequirePermission('scope-of-work:create')
  @Post('projects/:projectId/categories')
  addCategoryToProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectScopeCategoryDto,
  ) {
    return this.scopeOfWorkService.addCategoryToProject(projectId, dto);
  }

  @RequirePermission('scope-of-work:read')
  @Get('projects/:projectId/categories')
  getProjectCategories(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getProjectCategories(projectId);
  }

  @RequirePermission('scope-of-work:delete')
  @Delete('project-categories/:id')
  removeCategoryFromProject(@Param('id') id: string) {
    return this.scopeOfWorkService.removeCategoryFromProject(id);
  }

  // ============================================================
  // SCOPE ITEMS
  // ============================================================

  @RequirePermission('scope-of-work:create')
  @Post('projects/:projectId/items')
  createScopeItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateScopeItemDto,
  ) {
    return this.scopeOfWorkService.createScopeItem(projectId, dto);
  }

  @RequirePermission('scope-of-work:read')
  @Get('projects/:projectId/items')
  getScopeItems(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getScopeItems(projectId);
  }

  @RequirePermission('scope-of-work:read')
  @Get('items/:id')
  getScopeItem(@Param('id') id: string) {
    return this.scopeOfWorkService.getScopeItemById(id);
  }

  @RequirePermission('scope-of-work:update')
  @Patch('items/:id')
  updateScopeItem(@Param('id') id: string, @Body() dto: UpdateScopeItemDto) {
    return this.scopeOfWorkService.updateScopeItem(id, dto);
  }

  @RequirePermission('scope-of-work:delete')
  @Delete('items/:id')
  deleteScopeItem(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteScopeItem(id);
  }

  // ============================================================
  // SCOPE OF WORK DOCUMENT
  // ============================================================

  /**
   * Create Scope of Work for a project
   *
   * POST
   * /scope-of-work/projects/:projectId
   */
  @RequirePermission('scope-of-work:create')
  @Post('projects/:projectId')
  createScopeOfWork(
    @Param('projectId') projectId: string,
    @Body() dto: CreateScopeOfWorkDto,
  ) {
    return this.scopeOfWorkService.createScopeOfWork(projectId, dto);
  }
  @RequirePermission('scope-of-work:read')
  @Get('projects/:projectId')
  getScopeOfWorkByProject(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getScopeOfWorkByProject(projectId);
  }
  @RequirePermission('scope-of-work:create')
  @Post('projects/:projectId/complete')
  createComplete(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCompleteScopeOfWorkDto,
  ) {
    return this.scopeOfWorkService.createCompleteScopeOfWork(projectId, dto);
  }
  @RequirePermission('scope-of-work:read')
  @Get()
  getAllScopeOfWork() {
    return this.scopeOfWorkService.getAllScopeOfWork();
  }
  /**
   * Get Scope of Work by its own ID
   *
   * GET
   * /scope-of-work/by-id/:id
   */
  @RequirePermission('scope-of-work:read')
  @Get('by-id/:id')
  getScopeOfWorkById(@Param('id') id: string) {
    return this.scopeOfWorkService.getScopeOfWorkById(id);
  }

  /**
   * Update Scope of Work by its own ID
   *
   * PATCH
   * /scope-of-work/by-id/:id
   */
  @RequirePermission('scope-of-work:update')
  @Patch('by-id/:id')
  updateScopeOfWork(
    @Param('id') id: string,
    @Body() dto: UpdateScopeOfWorkDto,
  ) {
    return this.scopeOfWorkService.updateScopeOfWork(id, dto);
  }

  /**
   * Delete Scope of Work by its own ID
   *
   * DELETE
   * /scope-of-work/by-id/:id
   */
  @RequirePermission('scope-of-work:delete')
  @Delete('by-id/:id')
  deleteScopeOfWork(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteScopeOfWork(id);
  }
}

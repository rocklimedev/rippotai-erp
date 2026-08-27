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

  @Post('categories')
  createCategory(@Body() dto: CreateScopeCategoryDto) {
    return this.scopeOfWorkService.createCategory(dto);
  }

  @Get('categories')
  getCategories() {
    return this.scopeOfWorkService.findAllCategories();
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.scopeOfWorkService.findCategoryById(id);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateScopeCategoryDto) {
    return this.scopeOfWorkService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteCategory(id);
  }

  // ============================================================
  // PROJECT SPACES
  // ============================================================

  @Post('projects/:projectId/spaces')
  createProjectSpace(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectSpaceDto,
  ) {
    return this.scopeOfWorkService.createProjectSpace(projectId, dto);
  }

  @Get('projects/:projectId/spaces')
  getProjectSpaces(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getProjectSpaces(projectId);
  }

  @Get('spaces/:id')
  getProjectSpace(@Param('id') id: string) {
    return this.scopeOfWorkService.getProjectSpaceById(id);
  }

  @Patch('spaces/:id')
  updateProjectSpace(
    @Param('id') id: string,
    @Body() dto: UpdateProjectSpaceDto,
  ) {
    return this.scopeOfWorkService.updateProjectSpace(id, dto);
  }

  @Delete('spaces/:id')
  deleteProjectSpace(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteProjectSpace(id);
  }

  // ============================================================
  // PROJECT SCOPE CATEGORIES
  // ============================================================

  @Post('projects/:projectId/categories')
  addCategoryToProject(
    @Param('projectId') projectId: string,
    @Body() dto: CreateProjectScopeCategoryDto,
  ) {
    return this.scopeOfWorkService.addCategoryToProject(projectId, dto);
  }

  @Get('projects/:projectId/categories')
  getProjectCategories(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getProjectCategories(projectId);
  }

  @Delete('project-categories/:id')
  removeCategoryFromProject(@Param('id') id: string) {
    return this.scopeOfWorkService.removeCategoryFromProject(id);
  }

  // ============================================================
  // SCOPE ITEMS
  // ============================================================

  @Post('projects/:projectId/items')
  createScopeItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateScopeItemDto,
  ) {
    return this.scopeOfWorkService.createScopeItem(projectId, dto);
  }

  @Get('projects/:projectId/items')
  getScopeItems(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getScopeItems(projectId);
  }

  @Get('items/:id')
  getScopeItem(@Param('id') id: string) {
    return this.scopeOfWorkService.getScopeItemById(id);
  }

  @Patch('items/:id')
  updateScopeItem(@Param('id') id: string, @Body() dto: UpdateScopeItemDto) {
    return this.scopeOfWorkService.updateScopeItem(id, dto);
  }

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
  @Post('projects/:projectId')
  createScopeOfWork(
    @Param('projectId') projectId: string,
    @Body() dto: CreateScopeOfWorkDto,
  ) {
    return this.scopeOfWorkService.createScopeOfWork(projectId, dto);
  }
  @Get('projects/:projectId')
  getScopeOfWorkByProject(@Param('projectId') projectId: string) {
    return this.scopeOfWorkService.getScopeOfWorkByProject(projectId);
  }
  @Post('projects/:projectId/complete')
  createComplete(
    @Param('projectId') projectId: string,
    @Body() dto: CreateCompleteScopeOfWorkDto,
  ) {
    return this.scopeOfWorkService.createCompleteScopeOfWork(projectId, dto);
  }
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
  @Delete('by-id/:id')
  deleteScopeOfWork(@Param('id') id: string) {
    return this.scopeOfWorkService.deleteScopeOfWork(id);
  }
}

// src/modules/project-planner/controllers/project-planner.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ProjectPlannerService } from './project-planner.service';

import {
  AttachPlannerLocationsDto,
  CreatePlannerItemDto,
  CreateProcurementItemDto,
  CreateProjectLocationDto,
  CreateProjectPlannerDto,
  GeneratePlannerTemplateDto,
  GetPlannerItemsQueryDto,
  GetProcurementItemsQueryDto,
  InitializeProjectPlannersDto,
  UpdatePlannerItemDto,
  UpdatePlannerItemLocationDto,
  UpdateProcurementItemDto,
  UpdateProjectLocationDto,
  UpdateProjectPlannerDto,
} from './dto';

@Controller()
export class ProjectPlannerController {
  constructor(private readonly projectPlannerService: ProjectPlannerService) {}

  // ============================================================
  // PROJECT PLANNERS
  // ============================================================

  /**
   * Initialize all standard planners for a project:
   *
   * - CONSULTANCY
   * - PMC
   * - VENDOR_PROCUREMENT
   */
  @Post('projects/:projectId/planners/initialize')
  initializeProjectPlanners(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,

    @Body()
    dto: InitializeProjectPlannersDto,
  ) {
    return this.projectPlannerService.initializeProjectPlanners(
      projectId,
      dto.user_id,
    );
  }

  /**
   * Create one individual planner.
   */
  @Post('projects/:projectId/planners')
  createPlanner(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,

    @Body()
    dto: CreateProjectPlannerDto,
  ) {
    return this.projectPlannerService.createPlanner(projectId, dto);
  }

  /**
   * Get every planner under a project.
   */
  @Get('projects/:projectId/planners')
  getProjectPlanners(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,
  ) {
    return this.projectPlannerService.getProjectPlanners(projectId);
  }

  /**
   * Main Project Planner dashboard data.
   *
   * Returns:
   * - project
   * - Consultancy planner
   * - PMC planner
   * - Vendor & Procurement planner
   * - phases
   * - planner items
   * - locations
   */
  @Get('projects/:projectId/planners/overview')
  getProjectPlannerOverview(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,
  ) {
    return this.projectPlannerService.getProjectPlannerOverview(projectId);
  }

  /**
   * Get one complete planner.
   */
  @Get('planners/:plannerId')
  getPlannerById(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,
  ) {
    return this.projectPlannerService.getPlannerById(plannerId);
  }

  /**
   * Update planner-level settings.
   */
  @Patch('planners/:plannerId')
  updatePlanner(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,

    @Body()
    dto: UpdateProjectPlannerDto,
  ) {
    return this.projectPlannerService.updatePlanner(plannerId, dto);
  }

  /**
   * Soft-delete planner.
   */
  @Delete('planners/:plannerId')
  deletePlanner(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,
  ) {
    return this.projectPlannerService.deletePlanner(plannerId);
  }

  // ============================================================
  // PLANNER TEMPLATE GENERATION
  // ============================================================

  /**
   * Copies master PlannerTaskTemplate rows into
   * project_planner_items.
   *
   * Applicable to:
   *
   * CONSULTANCY
   * PMC
   */
  @Post('planners/:plannerId/generate-template')
  generatePlannerFromTemplate(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,

    @Body()
    dto: GeneratePlannerTemplateDto,
  ) {
    return this.projectPlannerService.generatePlannerFromTemplate(
      plannerId,
      dto.user_id,
    );
  }

  // ============================================================
  // PROJECT LOCATIONS
  // FLOOR / ROOM / AREA / ZONE
  // ============================================================

  /**
   * Create location.
   *
   * Examples:
   *
   * Basement
   * Ground Floor
   * First Floor
   * Terrace
   *
   * Or nested:
   *
   * First Floor
   *   ├── Bedroom
   *   ├── Bathroom
   *   └── Lobby
   */
  @Post('projects/:projectId/locations')
  createLocation(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,

    @Body()
    dto: CreateProjectLocationDto,
  ) {
    return this.projectPlannerService.createLocation(projectId, dto);
  }

  /**
   * Get nested project location tree.
   */
  @Get('projects/:projectId/locations')
  getProjectLocations(
    @Param('projectId', new ParseUUIDPipe())
    projectId: string,
  ) {
    return this.projectPlannerService.getProjectLocations(projectId);
  }

  /**
   * Update floor / room / area / zone.
   */
  @Patch('locations/:locationId')
  updateLocation(
    @Param('locationId', new ParseUUIDPipe())
    locationId: string,

    @Body()
    dto: UpdateProjectLocationDto,
  ) {
    return this.projectPlannerService.updateLocation(locationId, dto);
  }

  // ============================================================
  // CONSULTANCY + PMC PLANNER ITEMS
  // ============================================================

  /**
   * Add one planner item.
   *
   * CONSULTANCY example:
   *
   * DESIGN
   *   CONCEPT DESIGN 02-3D
   *     WITH MATERIAL
   *
   *
   * PMC example:
   *
   * CIVIL WORK
   *   FLOORING
   */
  @Post('planners/:plannerId/items')
  createPlannerItem(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,

    @Body()
    dto: CreatePlannerItemDto,
  ) {
    return this.projectPlannerService.createPlannerItem(plannerId, dto);
  }

  /**
   * Get planner items.
   *
   * Optional:
   *
   * ?phaseId=<uuid>
   */
  @Get('planners/:plannerId/items')
  getPlannerItems(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,

    @Query()
    query: GetPlannerItemsQueryDto,
  ) {
    return this.projectPlannerService.getPlannerItems(plannerId, query.phaseId);
  }

  /**
   * Get one planner item including:
   *
   * - phase
   * - document type
   * - assignee
   * - floor/location statuses
   */
  @Get('planner-items/:itemId')
  getPlannerItem(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,
  ) {
    return this.projectPlannerService.getPlannerItemById(itemId);
  }

  /**
   * Update Consultancy / PMC work item.
   */
  @Patch('planner-items/:itemId')
  updatePlannerItem(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,

    @Body()
    dto: UpdatePlannerItemDto,
  ) {
    return this.projectPlannerService.updatePlannerItem(itemId, dto);
  }

  /**
   * Soft-delete planner item.
   */
  @Delete('planner-items/:itemId')
  deletePlannerItem(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,
  ) {
    return this.projectPlannerService.deletePlannerItem(itemId);
  }

  // ============================================================
  // PLANNER ITEM ↔ PROJECT LOCATION
  // ============================================================

  /**
   * Attach one planner item to multiple locations.
   *
   * Example:
   *
   * Flooring
   *
   * ->
   *
   * Ground Floor
   * First Floor
   * Second Floor
   */
  @Post('planner-items/:itemId/locations')
  attachLocations(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,

    @Body()
    dto: AttachPlannerLocationsDto,
  ) {
    return this.projectPlannerService.attachLocations(itemId, dto.location_ids);
  }

  /**
   * Remove one location from a planner item.
   */
  @Delete('planner-items/:itemId/locations/:locationId')
  removeLocationFromItem(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,

    @Param('locationId', new ParseUUIDPipe())
    locationId: string,
  ) {
    return this.projectPlannerService.removeLocationFromItem(
      itemId,
      locationId,
    );
  }

  // ============================================================
  // FLOOR / LOCATION PROGRESS
  // ============================================================

  /**
   * Update individual location progress.
   *
   * Example:
   *
   * FLOORING
   *
   * Ground Floor = 100%
   * First Floor = 50%
   * Second Floor = 0%
   *
   * Parent planner item progress is then automatically
   * recalculated by the service.
   */
  @Patch('planner-item-locations/:itemLocationId')
  updateItemLocation(
    @Param('itemLocationId', new ParseUUIDPipe())
    itemLocationId: string,

    @Body()
    dto: UpdatePlannerItemLocationDto,
  ) {
    return this.projectPlannerService.updateItemLocation(itemLocationId, dto);
  }

  // ============================================================
  // VENDOR & PROCUREMENT
  // ============================================================

  /**
   * Create Material / Labour procurement entry.
   *
   * MATERIAL:
   *
   * Tiles
   * Sanitary
   * Furniture
   * Paint
   *
   * LABOUR:
   *
   * Civil Contractor
   * Electrical Contractor
   * Plumbing Contractor
   */
  @Post('planners/:plannerId/procurement')
  createProcurementItem(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,

    @Body()
    dto: CreateProcurementItemDto,
  ) {
    return this.projectPlannerService.createProcurementItem(plannerId, dto);
  }

  /**
   * Get Vendor & Procurement items.
   *
   * Optional:
   *
   * ?itemType=MATERIAL
   *
   * ?itemType=LABOUR
   */
  @Get('planners/:plannerId/procurement')
  getProcurementItems(
    @Param('plannerId', new ParseUUIDPipe())
    plannerId: string,

    @Query()
    query: GetProcurementItemsQueryDto,
  ) {
    return this.projectPlannerService.getProcurementItems(
      plannerId,
      query.itemType,
    );
  }

  /**
   * Update Material / Labour procurement entry.
   */
  @Patch('procurement-items/:itemId')
  updateProcurementItem(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,

    @Body()
    dto: UpdateProcurementItemDto,
  ) {
    return this.projectPlannerService.updateProcurementItem(itemId, dto);
  }

  /**
   * Soft-delete procurement entry.
   */
  @Delete('procurement-items/:itemId')
  deleteProcurementItem(
    @Param('itemId', new ParseUUIDPipe())
    itemId: string,
  ) {
    return this.projectPlannerService.deleteProcurementItem(itemId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';

import { MaterialRequirementService } from '../services/material-requirement.service';

import { CreateMaterialRequirementDto } from '../dto/create-material-requirement.dto';
import { UpdateMaterialRequirementDto } from '../dto/update-material-requirement.dto';

import { RequirementStatus } from '../../../common/enums/requirement-status.enum';

/**
 * Material Requirements
 *
 * Material requirements are captured directly from the design team.
 *
 * Procurement flow:
 *
 * Material Requirement
 *        │
 *        ├── Sample Boards
 *        │
 *        ├── Material Rate Sheets
 *        │       ├── Vendor A rate
 *        │       ├── Vendor B rate
 *        │       └── Vendor C rate
 *        │
 *        └── Vendor Quotations
 *                │
 *                ↓
 *          Rate Comparison
 *                │
 *                ↓
 *          Vendor Selection
 */
@Controller('procurement/requirements')
export class MaterialRequirementController {
  constructor(private readonly service: MaterialRequirementService) {}

  // ============================================================
  // CREATE
  // ============================================================

  /**
   * Create a material requirement.
   *
   * POST /procurement/requirements
   *
   * The requirement contains design-side information only:
   * - project
   * - designer
   * - item
   * - category
   * - selection/specification
   * - budget
   * - style
   * - functional needs
   *
   * Vendor rates are maintained separately through
   * MaterialRateSheet.
   */
  @Post()
  create(@Body() dto: CreateMaterialRequirementDto) {
    return this.service.create(dto);
  }

  // ============================================================
  // LIST
  // ============================================================

  /**
   * Get all material requirements.
   *
   * Optional:
   * ?projectId=<project-id>
   *
   * GET /procurement/requirements
   * GET /procurement/requirements?projectId=<project-id>
   *
   * The response includes:
   * - sampleBoards
   * - material
   * - material.vendors
   * - quotations
   */
  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.service.findAll(projectId);
  }

  // ============================================================
  // GET BY PROJECT
  // ============================================================

  /**
   * Get all material requirements belonging to a project.
   *
   * GET /procurement/requirements/project/:projectId
   *
   * Returns:
   * - material requirements
   * - sample boards
   * - material master
   * - material vendors
   * - quotations
   */
  @Get('project/:projectId')
  getMaterialRequirementsByProject(@Param('projectId') projectId: string) {
    return this.service.getMaterialRequirementsByProject(projectId);
  }

  // ============================================================
  // GET ONE
  // ============================================================

  /**
   * Get a single material requirement with
   * its related sourcing information.
   *
   * GET /procurement/requirements/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  /**
   * Update design-side requirement information.
   *
   * PATCH /procurement/requirements/:id
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMaterialRequirementDto) {
    return this.service.update(id, dto);
  }

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  /**
   * Update the material requirement workflow status.
   *
   * PATCH /procurement/requirements/:id/status
   *
   * Body:
   * {
   *   "status": "DRAFT"
   * }
   */
  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body('status') status: RequirementStatus,
  ) {
    return this.service.setStatus(id, status);
  }

  // ============================================================
  // DELETE
  // ============================================================

  /**
   * Delete a material requirement.
   *
   * Related MaterialRateSheet records should be deleted
   * through the database foreign-key CASCADE.
   *
   * DELETE /procurement/requirements/:id
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

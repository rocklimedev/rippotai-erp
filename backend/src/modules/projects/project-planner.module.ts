// src/modules/project-planner/project-planner.module.ts

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// ===================== Existing Models =====================

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { Vendor } from '../vendors/models/vendors.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';

// ===================== Planner Models =====================

import { ProjectPhase } from './models/project-phase.model';
import { ProjectPlanner } from './models/project_planners.model';
import { ProjectPlannerItem } from './models/project_planner_items.model';
import { ProjectLocation } from './models/project_locations.model';
import { ProjectPlannerItemLocation } from './models/project_planner_item_locations.model';
import { ProjectProcurementItem } from './models/project_procurement_items.model';
import { PlannerTaskTemplate } from './models/planner-task-template.model';

// ===================== Controller / Service =====================

import { ProjectPlannerController } from './project-planner.controller';
import { ProjectPlannerService } from './project-planner.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      // Existing
      Project,
      User,
      Vendor,
      DocumentType,

      // Planner
      ProjectPhase,
      ProjectPlanner,
      ProjectPlannerItem,
      ProjectLocation,
      ProjectPlannerItemLocation,
      ProjectProcurementItem,
      PlannerTaskTemplate,
    ]),
  ],

  controllers: [ProjectPlannerController],

  providers: [ProjectPlannerService],

  exports: [ProjectPlannerService, SequelizeModule],
})
export class ProjectPlannerModule {}

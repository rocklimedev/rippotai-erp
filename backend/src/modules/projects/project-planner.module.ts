import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectPhase } from './models/project-phase.model';
import { PlannerTaskTemplate } from './models/planner-task-template.model';
import { ProjectPlannerTask } from './models/project-planner-task.model';
import { ProjectFloor } from './models/project-floor.model';
import { ProjectRoom } from './models/project-room.model';
import { PlannerTaskFloorProgress } from './models/planner-task-floor-progress.model';
import { ProcurementCategory } from './models/procurement-category.model';
import { ProjectVendorProcurement } from './models/project-vendor-procurement.model';
import { ProjectPlannerExport } from './models/project-planner-export.model';
import { ProjectPlannerService } from './project-planner.service';
import { ProjectPlannerController } from './project-planner.controller';
import { VendorProcurementService } from './vendor-procurement.service';
import { VendorProcurementController } from './vendor-procurement.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ProjectPhase,
      PlannerTaskTemplate,
      ProjectPlannerTask,
      ProjectFloor,
      ProjectRoom,
      PlannerTaskFloorProgress,
      ProcurementCategory,
      ProjectVendorProcurement,
      ProjectPlannerExport,
    ]),
  ],
  controllers: [ProjectPlannerController, VendorProcurementController],
  providers: [ProjectPlannerService, VendorProcurementService],
  exports: [ProjectPlannerService, VendorProcurementService],
})
export class ProjectPlannerModule {}

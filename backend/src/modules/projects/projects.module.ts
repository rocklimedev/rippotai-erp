import { GateEngineModule } from '../gates/gate-engine.module';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Project } from './models/projects.model';
import { ProjectType } from './models/project-type.model';
import { Milestone } from './models/milestone.model';
import { ProjectPhase } from './models/project-phase.model';

import { ProjectsService } from './projects.service';
import { ProjectTypeService } from './project-type.service';
import { ProjectDashboardService } from './project-dashboard.service';
import { ProjectPhaseService } from './project-phase.service';
import { CommandCenterService } from './command-center.service';

import { ProjectsController } from './projects.controller';
import { ProjectTypeController } from './project-type.controller';
import { ProjectPhaseController } from './project-phase.controller';
import { CommandCenterController } from './command-center.controller';

import { ActivityLogsModule } from '../engagement/activity-logs.module';
import { NotificationsModule } from '../engagement/notifications.module';
import { ClientsModule } from '../clients/clients.module';

import { TeamMember } from '../users/models/team-member.model';

// ============================================================
// COMMAND CENTER MODELS
// ============================================================

import { ProjectGate } from '@/modules/gates/models/project-gate.model';
import { GateDefinition } from '@/modules/gates/models/gate-definition.model';

import { Document } from '@/modules/documents/models/document.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';
import { DocumentRequirement } from '@/modules/documents/models/document-requirement.model';

import { TaskDefinition } from '../tasks/models/task-definitions.model';
import { TaskExecution } from '../tasks/models/task-execution.model';

import { ActivityLog } from '../engagement/models/activity-log.model';

// ============================================================
// CDN
// ============================================================

// Adjust this path only if your module has a different filename/location.
import { CdnModule } from '@/modules/cdn/cdn.module';

@Module({
  imports: [
    GateEngineModule,
    SequelizeModule.forFeature([
      // --------------------------------------------------------
      // PROJECTS
      // --------------------------------------------------------
      Project,
      ProjectType,
      Milestone,
      ProjectPhase,
      TeamMember,

      // --------------------------------------------------------
      // COMMAND CENTER — GATES
      // --------------------------------------------------------
      ProjectGate,
      GateDefinition,

      // --------------------------------------------------------
      // COMMAND CENTER — DOCUMENTS
      // --------------------------------------------------------
      Document,
      DocumentType,
      DocumentRequirement,

      // --------------------------------------------------------
      // COMMAND CENTER — TASKS
      // --------------------------------------------------------
      TaskDefinition,
      TaskExecution,

      // --------------------------------------------------------
      // COMMAND CENTER — ACTIVITY
      // --------------------------------------------------------
      ActivityLog,
    ]),

    // ----------------------------------------------------------
    // EXISTING MODULES
    // ----------------------------------------------------------
    ActivityLogsModule,
    NotificationsModule,
    ClientsModule,

    // ----------------------------------------------------------
    // REQUIRED BY CommandCenterService
    // ----------------------------------------------------------
    CdnModule,
  ],

  controllers: [
    ProjectsController,
    ProjectTypeController,
    ProjectPhaseController,

    // Command Center
    CommandCenterController,
  ],

  providers: [
    ProjectsService,
    ProjectTypeService,
    ProjectDashboardService,
    ProjectPhaseService,

    // Command Center
    CommandCenterService,
  ],

  exports: [
    ProjectsService,
    ProjectTypeService,
    ProjectDashboardService,
    ProjectPhaseService,

    // Export this only if another module will consume it.
    CommandCenterService,
  ],
})
export class ProjectsModule {}

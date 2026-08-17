import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { Phase } from './models/phase.model';
import { Step } from './models/step.model';
import { Team } from './models/team.model';
import { StepTeam } from './models/step-team.model';
import { Deliverable } from './models/deliverable.model';
import { Project } from './models/project.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { GateLog } from './models/gate-log.model';
import { ContinuityRole } from './models/continuity-role.model';
import { ProjectDeliverableRecord } from './models/project-deliverable-record.model';

// Services
import { LibraryService } from './library.service';
import { ProgressService } from './progress.service';
import { GateService } from './gate.service';
import { TimelineService } from './timeline.service';
import { ContinuityService } from './continuity.service';
import { DocumentRegisterService } from './document-register.service';

// Controllers
import { LibraryController } from './library.controller';
import { ProgressController } from './progress.controller';
import { GateController } from './gate.controller';
import { TimelineController } from './timeline.controller';
import { ContinuityController } from './continuity.controller';
import { DocumentRegisterController } from './document-register.controller';

/**
 * Process Workflow Engine — the "Master Process Brain".
 *
 * Covers:
 *  1. Phase & step library (Brief -> ... -> Snag & Handover, plus Vendor & Trades
 *     and Material & Procurement parallel tracks)
 *  2. Gate tracking (hard gates with timestamp + approver)
 *  3. Team responsibility mapping (Architect, Supervisor, Admin, Accounts,
 *     Planning, Procurement, Client, 12 trades)
 *  4. Deliverable catalogue -> live document register per project
 *  5. Per-project progress tracking (phase & step level)
 *  6. Process timeline visualisation (Gantt-style data + gate markers)
 *  7. Continuity roles (end-to-end vs gate-bound)
 */
@Module({
  imports: [
    SequelizeModule.forFeature([
      Phase,
      Step,
      Team,
      StepTeam,
      Deliverable,
      Project,
      ProjectStepProgress,
      GateLog,
      ContinuityRole,
      ProjectDeliverableRecord,
    ]),
  ],
  controllers: [
    LibraryController,
    ProgressController,
    GateController,
    TimelineController,
    ContinuityController,
    DocumentRegisterController,
  ],
  providers: [
    LibraryService,
    ProgressService,
    GateService,
    TimelineService,
    ContinuityService,
    DocumentRegisterService,
  ],
  exports: [
    LibraryService,
    ProgressService,
    GateService,
    TimelineService,
    ContinuityService,
    DocumentRegisterService,
  ],
})
export class ProcessWorkflowModule {}

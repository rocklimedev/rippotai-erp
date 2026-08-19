import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../projects/models/projects.model';
import { Phase } from './models/phase.model';
import { Step } from './models/step.model';
import { ProjectStepProgress } from './models/project-step-progress.model';
import { GateLog } from './models/gate-log.model';
import { StepStatus } from '../../common/enums/process-workflow.enums';

export interface GanttBar {
  stepId: number;
  stepCode: string;
  stepName: string;
  phaseId: number;
  phaseName: string;
  trackType: string;
  isGate: boolean;
  gateName: string | null;
  status: StepStatus;
  start: string | null; // ISO date, planned or actual
  end: string | null;
  isPlanned: boolean; // true if dates are planned (not yet actual)
}

export interface GateMarker {
  stepId: number;
  gateName: string;
  achievedAt: string;
  approverName: string;
}

@Injectable()
export class TimelineService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(Phase) private phaseModel: typeof Phase,
    @InjectModel(Step) private stepModel: typeof Step,
    @InjectModel(ProjectStepProgress)
    private progressModel: typeof ProjectStepProgress,
    @InjectModel(GateLog) private gateLogModel: typeof GateLog,
  ) {}

  /**
   * Builds the data for a Gantt-style view of a project plotted against the full
   * phase ruler (all three tracks), with gate markers overlaid. Rendering the
   * actual chart is left to the frontend; this returns the bars + markers.
   */
  async getProjectTimeline(
    projectId: number,
  ): Promise<{ bars: GanttBar[]; gates: GateMarker[] }> {
    const project = await this.projectModel.findByPk(projectId);
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const phases = await this.phaseModel.findAll({
      order: [['order', 'ASC']],
      include: [
        {
          model: this.stepModel,
          separate: true,
          order: [['order', 'ASC']],
          include: [
            {
              model: this.progressModel,
              where: { projectId },
              required: false,
            },
          ],
        },
      ],
    });

    const bars: GanttBar[] = [];
    let cursor = project.expected_completion_date
      ? new Date(project.expected_completion_date)
      : new Date();

    for (const phase of phases) {
      for (const step of phase.steps ?? []) {
        const progress = step.progressEntries?.[0] ?? null;

        let start: Date | null = null;
        let end: Date | null = null;
        let isPlanned = true;

        if (progress?.actualStartDate || progress?.plannedStartDate) {
          start = progress.actualStartDate
            ? new Date(progress.actualStartDate)
            : new Date(progress.plannedStartDate as string);
          isPlanned = !progress.actualStartDate;
        } else {
          // No dates recorded yet: project the step forward from the running cursor
          // using its default duration, so the ruler still has a full projection.
          start = new Date(cursor);
        }

        if (progress?.actualCompletionDate || progress?.plannedEndDate) {
          end = progress.actualCompletionDate
            ? new Date(progress.actualCompletionDate)
            : new Date(progress.plannedEndDate as string);
        } else {
          end = new Date(start);
          end.setDate(end.getDate() + (step.defaultDurationDays || 1));
        }

        cursor = new Date(end);

        bars.push({
          stepId: step.id,
          stepCode: step.code,
          stepName: step.name,
          phaseId: phase.id,
          phaseName: phase.name,
          trackType: phase.trackType,
          isGate: step.isGate,
          gateName: step.gateName,
          status: progress?.status ?? StepStatus.NOT_STARTED,
          start: start.toISOString().slice(0, 10),
          end: end.toISOString().slice(0, 10),
          isPlanned,
        });
      }
    }

    const gateLogs = await this.gateLogModel.findAll({
      where: { projectId },
      order: [['achievedAt', 'ASC']],
    });
    const gates: GateMarker[] = gateLogs.map((g) => ({
      stepId: g.stepId,
      gateName: g.gateName,
      achievedAt: g.achievedAt.toISOString().slice(0, 10),
      approverName: g.approverName,
    }));

    return { bars, gates };
  }
}

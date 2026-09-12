import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { GateEngineService } from '../gates/gate-engine.service';
import {
  DocumentEvidenceService,
  mandatoryDocument,
} from '../gates/conditions/document-evidence.service';
import { Op } from 'sequelize';

import { Project } from '@/modules/projects/models/projects.model';
import { ProjectType } from '@/modules/projects/models/project-type.model';
import { ProjectPhase } from './models/project-phase.model';
import { ProjectGate } from '@/modules/gates/models/project-gate.model';
import { GateDefinition } from '@/modules/gates/models/gate-definition.model';
import { CdnService } from '@/modules/cdn/cdn.service';

// Existing document system — reused as-is instead of the bespoke
// DocumentDefinition/DocumentSubmission models from the first draft.
import { Document } from '@/modules/documents/models/document.model';
import { DocumentType } from '@/modules/documents/models/document-type.model';
import { DocumentRequirement } from '@/modules/documents/models/document-requirement.model';

// Existing generic audit log — reused instead of a bespoke project feed.
import { ActivityLog } from '../engagement/models/activity-log.model';
import { ActivityAction } from '@/common/enums';
import { TaskDefinition } from '../tasks/models/task-definitions.model';
import { TaskExecution } from '../tasks/models/task-execution.model';

import {
  PhaseRollupState,
  ProjectHealth,
  TaskExecutionStatus,
} from '@/common/enums/command-center.enum';
import { ProjectPhaseModule } from '@/common/enums/project-planner.enum';

import {
  ApproveGateDto,
  CompleteTaskDto,
  HealthFilter,
  PortfolioQueryDto,
  ReviewDocumentDto,
  PortfolioProjectResponseDto,
  ProjectPhasesResponseDto,
  UploadDocumentDto,
} from './dto/command-center.dto';

const STALE_DAYS = 7;

/**
 * String values must match the actual members of your ActivityAction
 * enum (@/common/enums) — this is the one place to fix them if the
 * names differ. Everything below casts through this map rather than
 * referencing ActivityAction.X directly so a mismatch fails in one
 * spot instead of scattered across the service.
 */
const ACTIVITY_ACTIONS = {
  DOCUMENT_UPLOADED: 'file_uploaded',
  DOCUMENT_APPROVED: 'file_uploaded',
  DOCUMENT_REJECTED: 'file_uploaded',
  TASK_COMPLETED: 'task_completed',
  TASK_FAILED: 'task_status_changed',
  GATE_APPROVED: 'GATE_APPROVED',
  GATE_OVERRIDDEN: 'GATE_OVERRIDDEN',
} as const;

export interface ActorContext {
  id: string;
  email: string;
  role: string;
  permissions?: string[];
  isAdmin?: boolean;
  ip?: string | null;
  userAgent?: string | null;
  /** Optional display name, falls back to email on document records */
  name?: string | null;
}

interface PhaseRollup {
  id: string;
  code: string;
  phaseNumber: number;
  name: string;
  gate: { id: string | null; code: string | null; name: string | null };
  docsDone: number;
  docsTotal: number;
  tasksDone: number;
  tasksTotal: number;
  pct: number;
  state: PhaseRollupState;
  gateApproved: boolean;
  gateApprovedBy: string | null;
}

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  location: string;
  currentPhaseSeq: number;
  phases: PhaseRollup[];
  pct: number;
  health: { key: ProjectHealth; label: string };
  daysIdle: number | null;
  lastActivity: Date | null;
}

@Injectable()
export class CommandCenterService {
  private readonly logger = new Logger(CommandCenterService.name);

  constructor(
    @InjectModel(Project) private readonly projectModel: typeof Project,
    @InjectModel(ProjectPhase)
    private readonly phaseModel: typeof ProjectPhase,
    @InjectModel(ProjectGate) private readonly gateModel: typeof ProjectGate,
    @InjectModel(DocumentType)
    private readonly docTypeModel: typeof DocumentType,
    @InjectModel(DocumentRequirement)
    private readonly docReqModel: typeof DocumentRequirement,
    @InjectModel(Document) private readonly docModel: typeof Document,
    @InjectModel(TaskDefinition)
    private readonly taskDefModel: typeof TaskDefinition,
    @InjectModel(TaskExecution)
    private readonly taskExecModel: typeof TaskExecution,
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
    private readonly cdnService: CdnService,
    private readonly gateEngine: GateEngineService,
    private readonly evidence: DocumentEvidenceService,
  ) {}

  // ============================================================
  // PORTFOLIO / ROLLUPS
  // ============================================================

  /**
   * Which module (CONSULTANCY / PMC / DOCUMENTS) a project's phase set
   * belongs to. Project doesn't carry this column in what you gave me —
   * add one (or derive it from ProjectType) and swap this one line out.
   */
  private getProjectModule(project: Project): ProjectPhaseModule {
    return ProjectPhaseModule.DOCUMENTS;
  }

  /**
   * Whether a DocumentType counts toward a phase's completion for a given
   * project. A per-project DocumentRequirement can override the master
   * requirementType (e.g. escalate an OPTIONAL doc to REQUIRED for one
   * client) and is the only way a CONDITIONAL doc becomes mandatory.
   */
  private isDocMandatory(
    docType: DocumentType,
    requirement?: DocumentRequirement,
  ): boolean {
    return mandatoryDocument(docType, requirement);
  }

  async getPortfolio(
    query: PortfolioQueryDto,
  ): Promise<PortfolioProjectResponseDto[]> {
    const projects = await this.projectModel.findAll({
      include: [{ model: ProjectType, as: 'project_type' }],
      order: [['updated_at', 'DESC']],
    });

    let rows = await Promise.all(
      projects.map((project) => this.buildProjectRow(project)),
    );

    if (query.health && query.health !== HealthFilter.ALL) {
      rows = rows.filter(
        (r) => r.health.key === (query.health as unknown as ProjectHealth),
      );
    }

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();

      rows = rows.filter((r) =>
        `${r.name} ${r.code} ${r.location}`.toLowerCase().includes(q),
      );
    }

    return rows;
  }
  async getProjectPhases(projectId: string): Promise<ProjectPhasesResponseDto> {
    const project = await this.mustFindProject(projectId);

    return this.buildProjectRow(project);
  }
  async getKpis() {
    const rows = await this.getPortfolio({});
    const allPhases = rows.flatMap((r) => r.phases);
    const totalValue = (await this.projectModel.findAll()).reduce(
      (s, p) => s + Number(p.approved_value ?? 0),
      0,
    );

    return {
      live: rows.length,
      awaiting: allPhases.filter(
        (p) => p.state === PhaseRollupState.AWAITING_GATE,
      ).length,
      stalled: allPhases.filter((p) => p.state === PhaseRollupState.STALLED)
        .length,
      failed: allPhases.filter((p) => p.state === PhaseRollupState.QC_FAILED)
        .length,
      docsMissing: allPhases.reduce(
        (s, p) =>
          s +
          (p.state !== PhaseRollupState.NOT_STARTED &&
          p.state !== PhaseRollupState.COMPLETE
            ? Math.max(0, p.docsTotal - p.docsDone)
            : 0),
        0,
      ),
      value: totalValue,
    };
  }

  async getPhaseDetail(projectId: string, phaseId: string) {
    const project = await this.mustFindProject(projectId);
    const phase = await this.phaseModel.findByPk(phaseId);
    if (!phase || phase.module !== this.getProjectModule(project))
      throw new NotFoundException('Phase not found');
    projectId = project.id;

    const [docTypes, taskDefs, taskExecs] = await Promise.all([
      // NOTE: DocumentType links to a phase via the denormalized
      // phaseCode string, not a phase_id FK — see the module-level
      // caveat about module scoping at the top of this file.
      this.docTypeModel.findAll({
        where: { phaseCode: phase.phase_code, isActive: true },
        order: [['sequence', 'ASC']],
      }),
      this.taskDefModel.findAll({ where: { phase_id: phaseId } }),
      this.taskExecModel.findAll({ where: { project_id: projectId } }),
    ]);

    const requirements = docTypes.length
      ? await this.docReqModel.findAll({
          where: {
            projectId,
            documentTypeId: docTypes.map((d) => d.id),
          },
        })
      : [];

    const evidenceByType = new Map(
      await Promise.all(
        docTypes.map(
          async (type) =>
            [type.id, await this.evidence.resolve(project.id, type)] as const,
        ),
      ),
    );
    const reqByTypeId = new Map(requirements.map((r) => [r.documentTypeId, r]));
    await Promise.all(
      docTypes.map(async (dt) => {
        const requirement = reqByTypeId.get(dt.id);
        reqByTypeId.set(dt.id, {
          ...(requirement?.get({ plain: true }) ?? {}),
          isCompleted: evidenceByType.get(dt.id)?.satisfied ?? false,
        } as DocumentRequirement);
      }),
    );
    const taskExecByDefId = new Map(
      taskExecs.map((t) => [t.task_definition_id, t]),
    );

    const gates = (await this.gateEngine.listProjectGates(project.id)).filter(
      (g) => g.phaseCode === phase.phase_code,
    );
    return {
      gates,
      docs: docTypes.map((dt) => {
        const requirement = reqByTypeId.get(dt.id);
        return {
          id: dt.id,
          code: dt.code,
          targetType: dt.targetType,
          evidence: evidenceByType.get(dt.id),
          name: dt.name,
          mandatory: this.isDocMandatory(dt, requirement),
          // DocumentType has no owner-role column today — add one if
          // Team Workload needs to attribute missing docs to a role.
          role: 'Unassigned',
          status: reqByTypeId.get(dt.id)?.isCompleted ? 'UPLOADED' : 'MISSING',
          requirementId: requirement?.id ?? null,
        };
      }),
      tasks: taskDefs
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          type: t.type,
          mandatory: t.mandatory,
          role: t.owner_role,
          status:
            taskExecByDefId.get(t.id)?.status ?? TaskExecutionStatus.PENDING,
        })),
      project: { code: project.slug, name: project.name },
      phase: { id: phase.id, code: phase.phase_code, name: phase.title },
    };
  }

  private async buildProjectRow(project: Project): Promise<ProjectRow> {
    await this.gateEngine.ensureInitialized(project.id);
    const moduleScope = this.getProjectModule(project);

    const phases = await this.phaseModel.findAll({
      where: { module: moduleScope },
      order: [['phase_number', 'ASC']],
    });

    if (phases.length === 0) {
      throw new BadRequestException(
        `No phases seeded for module "${moduleScope}"`,
      );
    }

    const currentPhase =
      phases.find((ph) => ph.phase_code === project.current_phase) ?? phases[0];

    const phaseCodesInModule = phases.map((p) => p.phase_code);

    const [docTypes, taskDefs, gates, requirements, documents, taskExecs] =
      await Promise.all([
        this.docTypeModel.findAll({
          where: {
            phaseCode: phaseCodesInModule,
            isActive: true,
          },
        }),

        this.taskDefModel.findAll({
          where: { module: moduleScope },
        }),

        this.gateModel.findAll({
          where: { projectId: project.id },
          include: [{ model: GateDefinition }],
        }),

        this.docReqModel.findAll({
          where: { projectId: project.id },
        }),

        this.docModel.findAll({
          where: { projectId: project.id },
        }),

        this.taskExecModel.findAll({
          where: { project_id: project.id },
        }),
      ]);

    const reqByTypeId = new Map(requirements.map((r) => [r.documentTypeId, r]));
    await Promise.all(
      docTypes.map(async (dt) => {
        const requirement = reqByTypeId.get(dt.id);
        reqByTypeId.set(dt.id, {
          ...(requirement?.get({ plain: true }) ?? {}),
          isCompleted: await this.evidence.satisfied(project.id, dt),
        } as DocumentRequirement);
      }),
    );

    const taskExecByDefId = new Map(
      taskExecs.map((t) => [t.task_definition_id, t]),
    );

    gates.sort(
      (a, b) => b.gateDefinition.sequenceOrder - a.gateDefinition.sequenceOrder,
    );
    const gateByPhaseId = new Map(
      gates.map((g) => [
        phases.find((p) => p.phase_code === g.gateDefinition?.phaseCode)?.id,
        g,
      ]),
    );

    const timestamps = [
      project.updatedAt,

      ...requirements.map(
        (r) => (r as unknown as { updatedAt: Date }).updatedAt,
      ),

      ...documents.map((d) => (d as unknown as { updatedAt: Date }).updatedAt),

      ...taskExecs.map((t) => t.updatedAt),
    ].filter((d): d is Date => d instanceof Date);
    const lastActivity =
      timestamps.length > 0
        ? new Date(Math.max(...timestamps.map((date) => date.getTime())))
        : null;

    const daysIdle =
      lastActivity !== null
        ? Math.floor((Date.now() - lastActivity.getTime()) / 86_400_000)
        : null;

    const phaseRollups = phases.map((phase) =>
      this.rollupPhase(
        phase,
        currentPhase,
        docTypes.filter((dt) => dt.phaseCode === phase.phase_code),
        taskDefs,
        reqByTypeId,
        taskExecByDefId,
        (() => {
          const group = gates.filter(
            (g) => g.gateDefinition.phaseCode === phase.phase_code,
          );
          return (
            group
              .filter((g) => g.status !== 'CLEARED')
              .sort(
                (a, b) =>
                  a.gateDefinition.sequenceOrder -
                  b.gateDefinition.sequenceOrder,
              )[0] ?? gateByPhaseId.get(phase.id)
          );
        })(),
        phase.id === currentPhase.id ? daysIdle : 0,
      ),
    );

    const pct = Math.round(
      phaseRollups.reduce((sum, phase) => sum + phase.pct, 0) /
        phaseRollups.length,
    );

    return {
      id: project.id,
      code: project.slug,
      name: project.name,
      location: project.site_location,
      currentPhaseSeq:
        phaseRollups.find(
          (p) => p.phaseNumber <= 9 && p.state !== PhaseRollupState.COMPLETE,
        )?.phaseNumber ?? 9,
      phases: phaseRollups,
      pct,
      health: this.computeHealth(phaseRollups),
      daysIdle,
      lastActivity,
    };
  }

  private rollupPhase(
    phase: ProjectPhase,
    currentPhase: ProjectPhase,
    phaseDocTypes: DocumentType[],
    taskDefs: TaskDefinition[],
    reqByTypeId: Map<string, DocumentRequirement>,
    taskExecByDefId: Map<string, TaskExecution>,
    gate: ProjectGate | undefined,
    idleDays: number | null,
  ): PhaseRollup {
    const mandatoryDocs = phaseDocTypes.filter((dt) =>
      this.isDocMandatory(dt, reqByTypeId.get(dt.id)),
    );
    const mandatoryTasks = taskDefs.filter(
      (t) => t.phase_id === phase.id && t.mandatory,
    );
    const total = mandatoryDocs.length + mandatoryTasks.length;
    const gateApproved = gate?.status === 'CLEARED';
    const gateMeta = {
      id: gate?.gateDefinitionId ?? null,
      code:
        (gate?.gateDefinition as unknown as { code?: string })?.code ?? null,
      name:
        (gate?.gateDefinition as unknown as { name?: string })?.name ?? null,
    };

    const docsDone = mandatoryDocs.filter(
      (dt) => reqByTypeId.get(dt.id)?.isCompleted,
    ).length;
    const hasFailedTask = mandatoryTasks.some(
      (t) => taskExecByDefId.get(t.id)?.status === TaskExecutionStatus.FAILED,
    );
    const tasksDone = mandatoryTasks.filter(
      (t) => taskExecByDefId.get(t.id)?.status === TaskExecutionStatus.DONE,
    ).length;
    const doneCount = docsDone + tasksDone;
    const pct = total ? Math.round((doneCount / total) * 100) : 0;

    let state: PhaseRollupState;
    if (hasFailedTask) state = PhaseRollupState.QC_FAILED;
    else if (pct === 100 && (gateApproved || !gate))
      state = PhaseRollupState.COMPLETE;
    else if (pct === 100) state = PhaseRollupState.AWAITING_GATE;
    else if (doneCount === 0) state = PhaseRollupState.NOT_STARTED;
    else if (idleDays !== null && idleDays >= STALE_DAYS)
      state = PhaseRollupState.STALLED;
    else state = PhaseRollupState.IN_PROGRESS;

    return {
      id: phase.id,
      code: phase.phase_code,
      phaseNumber: phase.phase_number,
      name: phase.title,
      gate: gateMeta,
      docsDone,
      docsTotal: mandatoryDocs.length,
      tasksDone,
      tasksTotal: mandatoryTasks.length,
      pct,
      state,
      gateApproved,
      gateApprovedBy: gate?.clearedBy ?? null,
    };
  }

  private computeHealth(phases: PhaseRollup[]) {
    if (phases.some((p) => p.state === PhaseRollupState.QC_FAILED))
      return { key: ProjectHealth.DANGER, label: 'QC Failed' };
    if (phases.some((p) => p.state === PhaseRollupState.STALLED))
      return { key: ProjectHealth.DANGER, label: 'Stalled' };
    if (phases.some((p) => p.state === PhaseRollupState.AWAITING_GATE))
      return { key: ProjectHealth.GATE, label: 'Gate Pending' };
    if (phases.every((p) => p.state === PhaseRollupState.COMPLETE))
      return { key: ProjectHealth.COMPLETE, label: 'Complete' };
    return { key: ProjectHealth.PROGRESS, label: 'On Track' };
  }

  // ============================================================
  // ACTION REQUIRED / DOCUMENT CONTROL / TASK QC
  // ============================================================

  async getActionRequired() {
    const rows = await this.getPortfolio({});
    const items: Array<{
      severe: boolean;
      title: string;
      project: string;
      meta: string;
      projectCode: string;
      phaseCode: string;
    }> = [];

    for (const row of rows) {
      if (row.health.key === ProjectHealth.COMPLETE) continue;
      const currentPhase = row.phases.find(
        (p) => p.phaseNumber === row.currentPhaseSeq,
      );
      if (!currentPhase) continue;

      const detail = await this.getPhaseDetail(row.id, currentPhase.id);
      detail.docs
        .filter((d) => d.mandatory && d.status === 'MISSING')
        .forEach((d) =>
          items.push({
            severe: currentPhase.state === PhaseRollupState.QC_FAILED,
            title: `${d.name} missing`,
            project: `${row.name} Â· ${currentPhase.name}`,
            meta: `Owner: ${d.role}`,
            projectCode: row.code,
            phaseCode: currentPhase.code,
          }),
        );
      detail.tasks
        .filter((t) => t.mandatory && t.status !== TaskExecutionStatus.DONE)
        .forEach((t) =>
          items.push({
            severe: t.status === TaskExecutionStatus.FAILED,
            title: `${t.status === TaskExecutionStatus.FAILED ? 'Redo' : 'Complete'}: ${t.name}`,
            project: `${row.name} Â· ${currentPhase.name}`,
            meta: `Owner: ${t.role}${row.daysIdle ? ` Â· ${row.daysIdle}d idle` : ''}`,
            projectCode: row.code,
            phaseCode: currentPhase.code,
          }),
        );
      if (currentPhase.state === PhaseRollupState.AWAITING_GATE) {
        items.push({
          severe: false,
          title: `${currentPhase.gate.code ?? 'Gate'} awaiting approval`,
          project: `${row.name} Â· ${currentPhase.name}`,
          meta: 'Owner: Admin',
          projectCode: row.code,
          phaseCode: currentPhase.code,
        });
      }
    }

    return items.sort((a, b) => Number(b.severe) - Number(a.severe));
  }

  async getDocumentControl() {
    const rows = await this.getPortfolio({});
    let required = 0;
    let uploaded = 0;
    const missing: Array<{
      evidence: unknown;
      targetType: string;
      projectId: string;
      id: string;
      name: string;
      project: string;
      code: string;
      phase: string;
      role: string;
    }> = [];

    for (const row of rows) {
      const currentPhase = row.phases.find(
        (p) => p.phaseNumber === row.currentPhaseSeq,
      );
      if (!currentPhase) continue;
      required += currentPhase.docsTotal;
      uploaded += currentPhase.docsDone;

      const detail = await this.getPhaseDetail(row.id, currentPhase.id);
      detail.docs
        .filter((d) => d.mandatory && d.status === 'MISSING')
        .forEach((d) =>
          missing.push({
            evidence: d.evidence,
            targetType: d.targetType,
            projectId: row.id,
            id: d.id,
            name: d.name,
            project: row.name,
            code: row.code,
            phase: currentPhase.name,
            role: d.role,
          }),
        );
    }

    return {
      stats: { required, uploaded, missing: required - uploaded },
      missingDocs: missing,
    };
  }

  async getTaskQc() {
    const rows = await this.getPortfolio({});
    const openTasks: Array<{
      id: string;
      name: string;
      type: string;
      status: TaskExecutionStatus;
      project: string;
      code: string;
      phase: string;
      role: string;
    }> = [];

    for (const row of rows) {
      const currentPhase = row.phases.find(
        (p) => p.phaseNumber === row.currentPhaseSeq,
      );
      if (!currentPhase) continue;
      const detail = await this.getPhaseDetail(row.id, currentPhase.id);
      detail.tasks
        .filter((t) => t.mandatory && t.status !== TaskExecutionStatus.DONE)
        .forEach((t) =>
          openTasks.push({
            id: t.id,
            name: t.name,
            type: t.type,
            status: t.status,
            project: row.name,
            code: row.code,
            phase: currentPhase.name,
            role: t.role,
          }),
        );
    }

    return openTasks.sort(
      (a, b) =>
        Number(b.status === TaskExecutionStatus.FAILED) -
        Number(a.status === TaskExecutionStatus.FAILED),
    );
  }

  async getTeamWorkload() {
    const [docControl, taskQc] = await Promise.all([
      this.getDocumentControl(),
      this.getTaskQc(),
    ]);
    const counts = new Map<string, number>();
    docControl.missingDocs.forEach((d) =>
      counts.set(d.role, (counts.get(d.role) ?? 0) + 1),
    );
    taskQc.forEach((t) => counts.set(t.role, (counts.get(t.role) ?? 0) + 1));

    return [...counts.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getCommercial() {
    const projects = await this.projectModel.findAll();
    const totalValue = projects.reduce(
      (s, p) => s + Number(p.approved_value ?? 0),
      0,
    );
    const rows = await this.getPortfolio({});
    const boqPhaseNumber = 10; // BOQ & Costing — adjust if your seed differs

    let approvedValue = 0;
    let awaiting = 0;
    let inProgress = 0;
    let passed = 0;

    rows.forEach((row, i) => {
      const boqPhase = row.phases.find((p) => p.phaseNumber === boqPhaseNumber);
      if (!boqPhase) return;
      if (boqPhase.state === PhaseRollupState.COMPLETE) {
        passed += 1;
        approvedValue += Number(
          projects.find((p) => p.id === row.id)?.approved_value ?? 0,
        );
      } else if (boqPhase.state === PhaseRollupState.AWAITING_GATE) {
        awaiting += 1;
      } else if (
        [
          PhaseRollupState.IN_PROGRESS,
          PhaseRollupState.STALLED,
          PhaseRollupState.QC_FAILED,
        ].includes(boqPhase.state)
      ) {
        inProgress += 1;
      }
    });

    return {
      totalValue,
      approvedValue,
      notReached: rows.length - passed - awaiting - inProgress,
      inProgress,
      awaiting,
      approved: passed,
    };
  }

  // ============================================================
  // ACTIONS: upload / review document, complete task, approve gate
  // ============================================================

  async uploadDocument(
    projectId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
    actor: ActorContext,
  ) {
    if (!file) throw new BadRequestException('A file is required');

    const [project, docType] = await Promise.all([
      this.mustFindProject(projectId),
      this.docTypeModel.findByPk(dto.documentTypeId),
    ]);
    projectId = project.id;
    if (!docType) throw new NotFoundException('Document type not found');
    if (this.evidence.isNative(docType))
      throw new BadRequestException(
        'This requirement is managed automatically from its source module; update the database record there.',
      );

    const [requirement] = await this.docReqModel.findOrCreate({
      where: { projectId, documentTypeId: dto.documentTypeId },
      defaults: {
        projectId,
        documentTypeId: dto.documentTypeId,
        requirementType: docType.requirementType,
      } as any,
    });

    if (docType.targetType === 'DRAWING')
      throw new BadRequestException(
        'Use the drawings upload endpoint for drawing evidence',
      );
    const upload = await this.cdnService.uploadFile(file);
    const needsApproval = docType.requiresApproval;

    const document = await this.docModel.create({
      projectId,
      documentTypeId: docType.id,
      requirementId: requirement.id,
      title: dto.title ?? docType.name,
      filename: file.originalname,
      storageFilename: upload.filename,
      url: upload.url,
      mime: file.mimetype,
      size: file.size,
      status: needsApproval ? 'submitted' : 'approved',
      remarks: dto.remarks ?? null,
      uploadedBy: actor.id,
      uploadedByName: actor.name ?? actor.email,
      docType: 'upload',
    } as any);

    await requirement.update({
      isCompleted: !needsApproval,
      completedAt: needsApproval ? null : new Date(),
    });

    await this.logActivity(actor, {
      action: ACTIVITY_ACTIONS.DOCUMENT_UPLOADED,
      entityType: 'Document',
      entityId: document.id,
      entityLabel: `${docType.name} Â· ${project.name}`,
      changes: { status: document.status, requirementId: requirement.id },
    });

    return document;
  }

  /** Approve/reject a submitted document — only relevant when docType.requiresApproval */
  async reviewDocument(
    documentId: string,
    dto: ReviewDocumentDto,
    actor: ActorContext,
  ) {
    if (!actor.isAdmin) {
      throw new ForbiddenException('Only admins can review documents');
    }

    const document = await this.docModel.findByPk(documentId);
    if (!document) throw new NotFoundException('Document not found');

    await document.update({
      status: dto.status,
      remarks: dto.remarks ?? document.remarks,
    });

    if (document.requirementId) {
      const requirement = await this.docReqModel.findByPk(
        document.requirementId,
      );
      if (requirement) {
        await requirement.update({
          isCompleted: dto.status === 'approved',
          completedAt: dto.status === 'approved' ? new Date() : null,
        });
      }
    }

    await this.logActivity(actor, {
      action:
        dto.status === 'approved'
          ? ACTIVITY_ACTIONS.DOCUMENT_APPROVED
          : ACTIVITY_ACTIONS.DOCUMENT_REJECTED,
      entityType: 'Document',
      entityId: document.id,
      entityLabel: document.title,
      changes: { status: dto.status },
    });

    return document;
  }

  async completeTask(
    projectId: string,
    taskDefinitionId: string,
    dto: CompleteTaskDto,
    actor: ActorContext,
  ) {
    const [project, taskDef] = await Promise.all([
      this.mustFindProject(projectId),
      this.taskDefModel.findByPk(taskDefinitionId),
    ]);
    projectId = project.id;
    if (!taskDef) throw new NotFoundException('Task definition not found');

    const [execution] = await this.taskExecModel.findOrCreate({
      where: { project_id: projectId, task_definition_id: taskDefinitionId },
      defaults: {
        project_id: projectId,
        task_definition_id: taskDefinitionId,
      } as any,
    });

    const status =
      dto.status === 'FAILED'
        ? TaskExecutionStatus.FAILED
        : TaskExecutionStatus.DONE;

    await execution.update({
      status,
      remarks: dto.remarks ?? null,
      completed_by: actor.id,
      completed_at: new Date(),
    });

    await this.logActivity(actor, {
      action:
        status === TaskExecutionStatus.FAILED
          ? ACTIVITY_ACTIONS.TASK_FAILED
          : ACTIVITY_ACTIONS.TASK_COMPLETED,
      entityType: 'TaskExecution',
      entityId: execution.id,
      entityLabel: `${taskDef.name} Â· ${project.name}`,
      changes: { status },
    });

    return execution;
  }

  async approveGate(
    projectId: string,
    phaseId: string,
    dto: ApproveGateDto,
    actor: ActorContext,
  ) {
    const project = await this.mustFindProject(projectId);
    const phase = await this.phaseModel.findByPk(phaseId);
    if (!phase || phase.module !== this.getProjectModule(project))
      throw new NotFoundException('Phase not found');
    projectId = project.id;
    const gates = await this.gateEngine.listProjectGates(project.id);
    const candidates = gates.filter((g) => g.phaseCode === phase.phase_code);
    const gate = candidates.find((g) => g.status !== 'CLEARED');
    if (!gate)
      throw new BadRequestException(
        'No uncleared gate configured for this phase',
      );
    return this.gateEngine.clearGate(
      project.id,
      gate.gateCode,
      {
        id: actor.id,
        email: actor.email,
        name: actor.name ?? actor.email,
        roleId: null,
        roleName: actor.role,
        permissions: actor.permissions ?? [],
      },
      dto,
    );
  }

  // ============================================================
  // ACTIVITY
  // ============================================================

  async getActivity(limit = 20, entityType?: string, entityId?: string) {
    const where: Record<string, unknown> = {};
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;

    return this.activityLogModel.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  private async logActivity(
    actor: ActorContext,
    params: {
      action: string;
      entityType?: string;
      entityId?: string;
      entityLabel?: string;
      changes?: Record<string, unknown>;
    },
  ) {
    return this.activityLogModel.create({
      user_id: actor.id,
      user_email: actor.email,
      user_role: actor.role,
      action: params.action as ActivityAction,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      entity_label: params.entityLabel ?? null,
      changes: params.changes ?? null,
      ip_address: actor.ip ?? null,
      user_agent: actor.userAgent ?? null,
    } as any);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async mustFindProject(projectId: string): Promise<Project> {
    const project = await this.projectModel.findOne({
      where: { [Op.or]: [{ id: projectId }, { slug: projectId }] } as any,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}

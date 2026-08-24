import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../projects/models/projects.model';
import { Deliverable } from '../process-workflow/models/deliverable.model';
import { ProjectDeliverableRecord } from '../process-workflow/models/project-deliverable-record.model';
import { Step } from '../process-workflow/models/step.model';
import { Phase } from '../process-workflow/models/phase.model';
import { RecordDeliverableDto } from '../process-workflow/dto/tracking.dto';

@Injectable()
export class DocumentRegisterService {
  constructor(
    @InjectModel(Project) private projectModel: typeof Project,
    @InjectModel(Deliverable) private deliverableModel: typeof Deliverable,
    @InjectModel(ProjectDeliverableRecord)
    private recordModel: typeof ProjectDeliverableRecord,
    @InjectModel(Step) private stepModel: typeof Step,
    @InjectModel(Phase) private phaseModel: typeof Phase,
  ) {}

  /** Marks a deliverable as submitted for a project (or updates the existing record). */
  async recordDeliverable(
    dto: RecordDeliverableDto,
  ): Promise<ProjectDeliverableRecord> {
    const project = await this.projectModel.findByPk(dto.projectId);
    if (!project)
      throw new NotFoundException(`Project ${dto.projectId} not found`);

    const deliverable = await this.deliverableModel.findByPk(dto.deliverableId);
    if (!deliverable)
      throw new NotFoundException(`Deliverable ${dto.deliverableId} not found`);

    const [record] = await this.recordModel.findOrCreate({
      where: { projectId: dto.projectId, deliverableId: dto.deliverableId },
      defaults: {
        projectId: dto.projectId,
        deliverableId: dto.deliverableId,
      } as any,
    });

    await record.update({
      isSubmitted: true,
      submittedAt: new Date(),
      fileUrl: dto.fileUrl ?? record.fileUrl,
      submittedBy: dto.submittedBy ?? record.submittedBy,
      version: dto.version ?? record.version,
    } as any);

    return record;
  }

  /**
   * The live document register for a project: every deliverable in the library,
   * joined against its fulfilment record for this project, grouped by phase/step.
   */
  async getDocumentRegister(projectId: number) {
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
              model: this.deliverableModel,
              include: [
                {
                  model: this.recordModel,
                  where: { projectId },
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    });

    return phases.map((phase) => ({
      phaseName: phase.name,
      phaseCode: phase.code,
      steps: (phase.steps ?? []).map((step) => ({
        stepName: step.name,
        stepCode: step.code,
        deliverables: (step.deliverables ?? []).map((d) => ({
          deliverableId: d.id,
          name: d.name,
          isRequired: d.isRequired,
          fileType: d.fileType,
          isSubmitted: d.records?.[0]?.isSubmitted ?? false,
          submittedAt: d.records?.[0]?.submittedAt ?? null,
          fileUrl: d.records?.[0]?.fileUrl ?? null,
          version: d.records?.[0]?.version ?? null,
        })),
      })),
    }));
  }
}

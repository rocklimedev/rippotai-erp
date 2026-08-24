import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Model, ModelStatic } from 'sequelize-typescript';
import { randomUUID } from 'crypto';

import { ProjectBrief } from './models/project-brief.model';
import { ProjectBriefDocument } from './models/project-brief-document.model';
import { ProjectBriefWorkType } from './models/project-brief-work-type.model';
import { ProjectBriefService } from './models/project-brief-service.model';
import { ProjectBriefProcurementCategory } from './models/project-brief-procurement-category.model';
import { ProjectBriefSpaceRequirement } from './models/project-brief-space-requirement.model';
import { ProjectBriefStyleDirection } from './models/project-brief-style-direction.model';
import { ProjectBriefReference } from './models/project-bref-reference.model';
import { ProjectBriefPhase } from './models/project-bref-phase.model';
import { ProjectBriefOccupant } from './models/project-brief-occupant.model';
import { ProjectBriefAttachment } from './models/project-brief-attachment.model';

import { CreateProjectBriefDto } from './dto/create-project-brief.dto';
import { UpdateProjectBriefDto } from './dto/update-project-brief.dto';
// =========================================================
// GENERIC CHILD REPLACER
// =========================================================

type ChildModelStatic = {
  destroy: (options: any) => Promise<number>;
  bulkCreate: (records: any[], options?: any) => Promise<any>;
};

@Injectable()
export class ProjectBriefsService {
  constructor(
    @InjectModel(ProjectBrief)
    private readonly projectBriefModel: typeof ProjectBrief,

    @InjectModel(ProjectBriefDocument)
    private readonly documentModel: typeof ProjectBriefDocument,

    @InjectModel(ProjectBriefWorkType)
    private readonly workTypeModel: typeof ProjectBriefWorkType,

    @InjectModel(ProjectBriefService)
    private readonly serviceModel: typeof ProjectBriefService,

    @InjectModel(ProjectBriefProcurementCategory)
    private readonly procurementCategoryModel: typeof ProjectBriefProcurementCategory,

    @InjectModel(ProjectBriefSpaceRequirement)
    private readonly spaceRequirementModel: typeof ProjectBriefSpaceRequirement,

    @InjectModel(ProjectBriefStyleDirection)
    private readonly styleDirectionModel: typeof ProjectBriefStyleDirection,

    @InjectModel(ProjectBriefReference)
    private readonly referenceModel: typeof ProjectBriefReference,

    @InjectModel(ProjectBriefPhase)
    private readonly phaseModel: typeof ProjectBriefPhase,

    @InjectModel(ProjectBriefOccupant)
    private readonly occupantModel: typeof ProjectBriefOccupant,

    @InjectModel(ProjectBriefAttachment)
    private readonly attachmentModel: typeof ProjectBriefAttachment,

    private readonly sequelize: Sequelize,
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  async create(dto: CreateProjectBriefDto) {
    const transaction = await this.sequelize.transaction();

    try {
      const {
        documents,
        workTypes,
        services,
        procurementCategories,
        spaceRequirements,
        styleDirections,
        references,
        phases,
        occupants,
        attachments,
        ...briefData
      } = dto;

      const existing = await this.projectBriefModel.findOne({
        where: {
          projectId: dto.projectId,
          version: dto.version ?? 1,
        },
        paranoid: false,
        transaction,
      });

      if (existing) {
        throw new BadRequestException(
          `Project brief version ${dto.version ?? 1} already exists for this project`,
        );
      }

      const brief = await this.projectBriefModel.create(
        {
          id: randomUUID(),
          ...briefData,
        } as any,
        { transaction },
      );

      await this.createChildren(
        brief.id,
        {
          documents,
          workTypes,
          services,
          procurementCategories,
          spaceRequirements,
          styleDirections,
          references,
          phases,
          occupants,
          attachments,
        },
        transaction,
      );

      await transaction.commit();

      return this.findOne(brief.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // =========================================================
  // FIND ALL
  // =========================================================

  async findAll(projectId?: string) {
    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    return this.projectBriefModel.findAll({
      where,
      order: [
        ['briefDate', 'DESC'],
        ['version', 'DESC'],
      ],
    });
  }

  // =========================================================
  // FIND ONE
  // =========================================================

  async findOne(id: string) {
    const brief = await this.projectBriefModel.findByPk(id, {
      include: [
        ProjectBriefDocument,
        ProjectBriefWorkType,
        ProjectBriefService,
        ProjectBriefProcurementCategory,
        ProjectBriefSpaceRequirement,
        ProjectBriefStyleDirection,
        ProjectBriefReference,
        ProjectBriefPhase,
        ProjectBriefOccupant,
        ProjectBriefAttachment,
      ],
    });

    if (!brief) {
      throw new NotFoundException('Project brief not found');
    }

    return brief;
  }

  // =========================================================
  // GET LATEST VERSION
  // =========================================================

  async findLatestByProject(projectId: string) {
    const brief = await this.projectBriefModel.findOne({
      where: {
        projectId,
      },
      order: [['version', 'DESC']],
      include: [
        ProjectBriefDocument,
        ProjectBriefWorkType,
        ProjectBriefService,
        ProjectBriefProcurementCategory,
        ProjectBriefSpaceRequirement,
        ProjectBriefStyleDirection,
        ProjectBriefReference,
        ProjectBriefPhase,
        ProjectBriefOccupant,
        ProjectBriefAttachment,
      ],
    });

    if (!brief) {
      throw new NotFoundException('No project brief exists for this project');
    }

    return brief;
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(id: string, dto: UpdateProjectBriefDto) {
    const transaction = await this.sequelize.transaction();

    try {
      const brief = await this.projectBriefModel.findByPk(id, {
        transaction,
      });

      if (!brief) {
        throw new NotFoundException('Project brief not found');
      }

      const {
        documents,
        workTypes,
        services,
        procurementCategories,
        spaceRequirements,
        styleDirections,
        references,
        phases,
        occupants,
        attachments,
        ...briefData
      } = dto;

      await brief.update(briefData as any, {
        transaction,
      });

      await this.replaceChildren(
        brief.id,
        {
          documents,
          workTypes,
          services,
          procurementCategories,
          spaceRequirements,
          styleDirections,
          references,
          phases,
          occupants,
          attachments,
        },
        transaction,
      );

      await transaction.commit();

      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // =========================================================
  // STATUS
  // =========================================================

  async updateStatus(id: string, status: string, userId?: string) {
    const brief = await this.projectBriefModel.findByPk(id);

    if (!brief) {
      throw new NotFoundException('Project brief not found');
    }

    const data: any = {
      status,
    };

    if (status === 'SIGNED_OFF') {
      data.confirmedByUserId = userId ?? null;
      data.confirmedDate = new Date();
    }

    await brief.update(data);

    return this.findOne(id);
  }

  // =========================================================
  // VERSION
  // =========================================================

  async createNewVersion(id: string) {
    const transaction = await this.sequelize.transaction();

    try {
      const current = await this.findOne(id);

      const latest = await this.projectBriefModel.findOne({
        where: {
          projectId: current.projectId,
        },
        order: [['version', 'DESC']],
        transaction,
      });

      const nextVersion = (latest?.version ?? 0) + 1;

      const newBrief = await this.projectBriefModel.create(
        {
          id: randomUUID(),
          projectId: current.projectId,
          relationshipToClient: current.relationshipToClient,
          referredBySource: current.referredBySource,
          briefDate: current.briefDate,
          siteAddress: current.siteAddress,
          propertyType: current.propertyType,
          siteArea: current.siteArea,
          siteAreaUnit: current.siteAreaUnit,
          siteAreaOtherUnit: current.siteAreaOtherUnit,
          facingOrientation: current.facingOrientation,
          parkingProvision: current.parkingProvision,
          ownershipStatus: current.ownershipStatus,
          numberOfFloors: current.numberOfFloors,
          liftAvailable: current.liftAvailable,
          siteType: current.siteType,
          siteTypeOther: current.siteTypeOther,
          siteCondition: current.siteCondition,
          drawingsOther: current.drawingsOther,

          workTypeOther: current.workTypeOther,
          servicesOther: current.servicesOther,
          areasIncludedInScope: current.areasIncludedInScope,
          areasExcludedFromScope: current.areasExcludedFromScope,
          workAlreadyDoneByOthers: current.workAlreadyDoneByOthers,

          vastuRequirements: current.vastuRequirements,
          coloursToAvoid: current.coloursToAvoid,
          materialsLiked: current.materialsLiked,
          materialsDislikedHardNo: current.materialsDislikedHardNo,
          mustHaveElements: current.mustHaveElements,
          coloursPreferred: current.coloursPreferred,
          maintenanceAppetite: current.maintenanceAppetite,

          initialClientBudget: current.initialClientBudget,
          budgetCurrency: current.budgetCurrency,
          budgetGstStatus: current.budgetGstStatus,
          fundingStage: current.fundingStage,
          budgetFlexibility: current.budgetFlexibility,

          desiredStartDate: current.desiredStartDate,
          startDateStatus: current.startDateStatus,
          siteHandoverDate: current.siteHandoverDate,
          targetCompletionDate: current.targetCompletionDate,
          deadlineReason: current.deadlineReason,
          phasingRequired: current.phasingRequired,

          societyRwaPermittedWorkTimings:
            current.societyRwaPermittedWorkTimings,
          nocOrSecurityDepositRequired: current.nocOrSecurityDepositRequired,
          structuralChangesPermitted: current.structuralChangesPermitted,
          materialMovementRestrictions: current.materialMovementRestrictions,
          neighbourSensitivities: current.neighbourSensitivities,
          powerAndWaterAvailability: current.powerAndWaterAvailability,
          accessStorageDebrisDisposal: current.accessStorageDebrisDisposal,
          ongoingWorkByOtherAgencies: current.ongoingWorkByOtherAgencies,

          householdNotes: current.householdNotes,
          openPointsToClose: current.openPointsToClose,

          briefTakenBy: current.briefTakenBy,
          briefTakenDate: current.briefTakenDate,

          status: 'DRAFT',
          version: nextVersion,
        } as any,
        { transaction },
      );

      await this.cloneChildren(current, newBrief.id, transaction);

      await transaction.commit();

      return this.findOne(newBrief.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // =========================================================
  // DELETE
  // =========================================================

  async remove(id: string) {
    const brief = await this.projectBriefModel.findByPk(id);

    if (!brief) {
      throw new NotFoundException('Project brief not found');
    }

    await brief.destroy();

    return {
      success: true,
      message: 'Project brief deleted successfully',
    };
  }

  // =========================================================
  // CREATE CHILDREN
  // =========================================================

  private async createChildren(
    projectBriefId: string,
    children: any,
    transaction: Transaction,
  ) {
    if (children.documents?.length) {
      await this.documentModel.bulkCreate(
        children.documents.map((item: any) => ({
          id: randomUUID(),
          projectBriefId,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.workTypes?.length) {
      await this.workTypeModel.bulkCreate(
        children.workTypes.map((item: any) => ({
          id: randomUUID(),
          projectBriefId,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.services?.length) {
      await this.serviceModel.bulkCreate(
        children.services.map((item: any) => ({
          id: randomUUID(),
          projectBriefId,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.procurementCategories?.length) {
      await this.procurementCategoryModel.bulkCreate(
        children.procurementCategories.map((item: any) => ({
          id: randomUUID(),
          projectBriefId,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.spaceRequirements?.length) {
      await this.spaceRequirementModel.bulkCreate(
        children.spaceRequirements.map((item: any, index: number) => ({
          id: randomUUID(),
          projectBriefId,
          sortOrder: item.sortOrder ?? index,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.styleDirections?.length) {
      await this.styleDirectionModel.bulkCreate(
        children.styleDirections.map((item: any) => ({
          id: randomUUID(),
          projectBriefId,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.references?.length) {
      await this.referenceModel.bulkCreate(
        children.references.map((item: any, index: number) => ({
          id: randomUUID(),
          projectBriefId,
          sortOrder: item.sortOrder ?? index,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.phases?.length) {
      await this.phaseModel.bulkCreate(
        children.phases.map((item: any, index: number) => ({
          id: randomUUID(),
          projectBriefId,
          sortOrder: item.sortOrder ?? index,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.occupants?.length) {
      await this.occupantModel.bulkCreate(
        children.occupants.map((item: any, index: number) => ({
          id: randomUUID(),
          projectBriefId,
          sortOrder: item.sortOrder ?? index,
          ...item,
        })),
        { transaction },
      );
    }

    if (children.attachments?.length) {
      await this.attachmentModel.bulkCreate(
        children.attachments.map((item: any) => ({
          id: randomUUID(),
          projectBriefId,
          ...item,
        })),
        { transaction },
      );
    }
  }
  // =========================================================
  // REPLACE CHILDREN
  // =========================================================

  private async replaceChildren(
    projectBriefId: string,
    children: any,
    transaction: Transaction,
  ) {
    await this.replaceChildCollection(
      this.documentModel,
      projectBriefId,
      children.documents,
      transaction,
    );

    await this.replaceChildCollection(
      this.workTypeModel,
      projectBriefId,
      children.workTypes,
      transaction,
    );

    await this.replaceChildCollection(
      this.serviceModel,
      projectBriefId,
      children.services,
      transaction,
    );

    await this.replaceChildCollection(
      this.procurementCategoryModel,
      projectBriefId,
      children.procurementCategories,
      transaction,
    );

    await this.replaceChildCollection(
      this.spaceRequirementModel,
      projectBriefId,
      children.spaceRequirements,
      transaction,
    );

    await this.replaceChildCollection(
      this.styleDirectionModel,
      projectBriefId,
      children.styleDirections,
      transaction,
    );

    await this.replaceChildCollection(
      this.referenceModel,
      projectBriefId,
      children.references,
      transaction,
    );

    await this.replaceChildCollection(
      this.phaseModel,
      projectBriefId,
      children.phases,
      transaction,
    );

    await this.replaceChildCollection(
      this.occupantModel,
      projectBriefId,
      children.occupants,
      transaction,
    );

    await this.replaceChildCollection(
      this.attachmentModel,
      projectBriefId,
      children.attachments,
      transaction,
    );
  }

  private async replaceChildCollection(
    model: ChildModelStatic,
    projectBriefId: string,
    records: any[] | undefined,
    transaction: Transaction,
  ) {
    // undefined means the collection was not included in the PATCH.
    // Leave existing records untouched.
    if (records === undefined) {
      return;
    }

    // Delete existing children
    await model.destroy({
      where: {
        projectBriefId,
      },
      transaction,
    });

    // Empty array means explicitly clear the collection.
    if (!records.length) {
      return;
    }

    // Re-create children
    await model.bulkCreate(
      records.map((item: any, index: number) => {
        const {
          id,
          projectBriefId: _projectBriefId,
          sortOrder,
          ...data
        } = item;

        return {
          id: id ?? randomUUID(),
          projectBriefId,

          ...(sortOrder !== undefined ? { sortOrder } : { sortOrder: index }),

          ...data,
        };
      }),
      {
        transaction,
      },
    );
  }

  // =========================================================
  // CLONE CHILDREN
  // =========================================================

  private async cloneChildren(
    source: ProjectBrief,
    targetBriefId: string,
    transaction: Transaction,
  ) {
    const clone = (items: any[] = []) =>
      items.map((item) => {
        const data = item.toJSON();

        delete data.id;
        delete data.projectBriefId;
        delete data.createdAt;
        delete data.updatedAt;

        return {
          id: randomUUID(),
          projectBriefId: targetBriefId,
          ...data,
        };
      });

    await this.documentModel.bulkCreate(clone(source.documents), {
      transaction,
    });

    await this.workTypeModel.bulkCreate(clone(source.workTypes), {
      transaction,
    });

    await this.serviceModel.bulkCreate(clone(source.services), { transaction });

    await this.procurementCategoryModel.bulkCreate(
      clone(source.procurementCategories),
      { transaction },
    );

    await this.spaceRequirementModel.bulkCreate(
      clone(source.spaceRequirements),
      { transaction },
    );

    await this.styleDirectionModel.bulkCreate(clone(source.styleDirections), {
      transaction,
    });

    await this.referenceModel.bulkCreate(clone(source.references), {
      transaction,
    });

    await this.phaseModel.bulkCreate(clone(source.phases), { transaction });

    await this.occupantModel.bulkCreate(clone(source.occupants), {
      transaction,
    });

    await this.attachmentModel.bulkCreate(clone(source.attachments), {
      transaction,
    });
  }
}

import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';

import {
  ProjectBriefStatus,
  SiteAreaUnit,
  SiteType,
  SiteCondition,
  MaintenanceAppetite,
  BudgetGstStatus,
  FundingStage,
  StartDateStatus,
} from '@/common/types/project-brief.types';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '../../users/models/user.model';

import { ProjectBriefDocument } from './project-brief-document.model';
import { ProjectBriefWorkType } from './project-brief-work-type.model';
import { ProjectBriefService } from './project-brief-service.model';
import { ProjectBriefProcurementCategory } from './project-brief-procurement-category.model';
import { ProjectBriefSpaceRequirement } from './project-brief-space-requirement.model';
import { ProjectBriefStyleDirection } from './project-brief-style-direction.model';
import { ProjectBriefReference } from './project-bref-reference.model';
import { ProjectBriefPhase } from './project-bref-phase.model';
import { ProjectBriefOccupant } from './project-brief-occupant.model';
import { ProjectBriefAttachment } from './project-brief-attachment.model';

@Table({
  tableName: 'project_briefs',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class ProjectBrief extends Model<ProjectBrief> {
  @PrimaryKey
  @Column({
    type: DataType.CHAR(36),
    allowNull: false,
  })
  declare id: string;

  @ForeignKey(() => Project)
  @AllowNull(false)
  @Index
  @Column({
    type: DataType.CHAR(36),
  })
  declare projectId: string;

  @BelongsTo(() => Project, 'projectId')
  declare project: Project;

  @Column(DataType.STRING)
  declare relationshipToClient: string | null;

  @Column(DataType.STRING)
  declare referredBySource: string | null;

  @Index
  @Column(DataType.DATEONLY)
  declare briefDate: string | null;

  // =========================================================
  // SITE
  // =========================================================

  @Column(DataType.TEXT)
  declare siteAddress: string | null;

  @Column(DataType.STRING)
  declare propertyType: string | null;

  @Column(DataType.DECIMAL(15, 2))
  declare siteArea: number | null;

  @Column({
    type: DataType.ENUM(...Object.values(SiteAreaUnit)),
  })
  declare siteAreaUnit: SiteAreaUnit | null;

  @Column(DataType.STRING(50))
  declare siteAreaOtherUnit: string | null;

  @Column(DataType.STRING)
  declare facingOrientation: string | null;

  @Column(DataType.TEXT)
  declare parkingProvision: string | null;

  @Column(DataType.STRING)
  declare ownershipStatus: string | null;

  @Column(DataType.INTEGER)
  declare numberOfFloors: number | null;

  @Column(DataType.BOOLEAN)
  declare liftAvailable: boolean | null;

  @Column({
    type: DataType.ENUM(...Object.values(SiteType)),
  })
  declare siteType: SiteType | null;

  @Column(DataType.STRING)
  declare siteTypeOther: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(SiteCondition)),
  })
  declare siteCondition: SiteCondition | null;

  @Column(DataType.TEXT)
  declare drawingsOther: string | null;

  // =========================================================
  // SCOPE
  // =========================================================

  @Column(DataType.STRING)
  declare workTypeOther: string | null;

  @Column(DataType.STRING)
  declare servicesOther: string | null;

  @Column(DataType.TEXT)
  declare areasIncludedInScope: string | null;

  @Column(DataType.TEXT)
  declare areasExcludedFromScope: string | null;

  @Column(DataType.TEXT)
  declare workAlreadyDoneByOthers: string | null;

  // =========================================================
  // DESIGN
  // =========================================================

  @Column(DataType.TEXT)
  declare vastuRequirements: string | null;

  @Column(DataType.TEXT)
  declare coloursToAvoid: string | null;

  @Column(DataType.TEXT)
  declare materialsLiked: string | null;

  @Column(DataType.TEXT)
  declare materialsDislikedHardNo: string | null;

  @Column(DataType.TEXT)
  declare mustHaveElements: string | null;

  @Column(DataType.TEXT)
  declare coloursPreferred: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(MaintenanceAppetite)),
  })
  declare maintenanceAppetite: MaintenanceAppetite | null;

  // =========================================================
  // BUDGET
  // =========================================================

  @Column(DataType.DECIMAL(15, 2))
  declare initialClientBudget: number | null;

  @AllowNull(false)
  @Default('INR')
  @Column(DataType.STRING(10))
  declare budgetCurrency: string;

  @Column({
    type: DataType.ENUM(...Object.values(BudgetGstStatus)),
  })
  declare budgetGstStatus: BudgetGstStatus | null;

  @Column({
    type: DataType.ENUM(...Object.values(FundingStage)),
  })
  declare fundingStage: FundingStage | null;

  @Column(DataType.TEXT)
  declare budgetFlexibility: string | null;

  // =========================================================
  // TIMELINE
  // =========================================================

  @Column(DataType.DATEONLY)
  declare desiredStartDate: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(StartDateStatus)),
  })
  declare startDateStatus: StartDateStatus | null;

  @Column(DataType.DATEONLY)
  declare siteHandoverDate: string | null;

  @Column(DataType.DATEONLY)
  declare targetCompletionDate: string | null;

  @Column(DataType.TEXT)
  declare deadlineReason: string | null;

  @Column(DataType.BOOLEAN)
  declare phasingRequired: boolean | null;

  // =========================================================
  // SITE OPERATIONS
  // =========================================================

  @Column(DataType.TEXT)
  declare societyRwaPermittedWorkTimings: string | null;

  @Column(DataType.TEXT)
  declare nocOrSecurityDepositRequired: string | null;

  @Column(DataType.TEXT)
  declare structuralChangesPermitted: string | null;

  @Column(DataType.TEXT)
  declare materialMovementRestrictions: string | null;

  @Column(DataType.TEXT)
  declare neighbourSensitivities: string | null;

  @Column(DataType.TEXT)
  declare powerAndWaterAvailability: string | null;

  @Column(DataType.TEXT)
  declare accessStorageDebrisDisposal: string | null;

  @Column(DataType.TEXT)
  declare ongoingWorkByOtherAgencies: string | null;

  // =========================================================
  // HOUSEHOLD
  // =========================================================

  @Column(DataType.TEXT)
  declare householdNotes: string | null;

  @Column(DataType.TEXT)
  declare openPointsToClose: string | null;

  // =========================================================
  // BRIEF CONTROL
  // =========================================================

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare briefTakenBy: string | null;

  @BelongsTo(() => User, 'briefTakenBy')
  declare briefTaker: User | null;

  @Column(DataType.DATEONLY)
  declare briefTakenDate: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.CHAR(36),
    allowNull: true,
  })
  declare confirmedByUserId: string | null;

  @BelongsTo(() => User, 'confirmedByUserId')
  declare confirmedBy: User | null;

  @Column(DataType.DATEONLY)
  declare confirmedDate: string | null;

  @AllowNull(false)
  @Default(ProjectBriefStatus.DRAFT)
  @Index
  @Column({
    type: DataType.ENUM(...Object.values(ProjectBriefStatus)),
  })
  declare status: ProjectBriefStatus;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  declare version: number;

  // =========================================================
  // CHILDREN
  // =========================================================

  @HasMany(() => ProjectBriefDocument, 'projectBriefId')
  declare documents: ProjectBriefDocument[];

  @HasMany(() => ProjectBriefWorkType, 'projectBriefId')
  declare workTypes: ProjectBriefWorkType[];

  @HasMany(() => ProjectBriefService, 'projectBriefId')
  declare services: ProjectBriefService[];

  @HasMany(() => ProjectBriefProcurementCategory, 'projectBriefId')
  declare procurementCategories: ProjectBriefProcurementCategory[];

  @HasMany(() => ProjectBriefSpaceRequirement, 'projectBriefId')
  declare spaceRequirements: ProjectBriefSpaceRequirement[];

  @HasMany(() => ProjectBriefStyleDirection, 'projectBriefId')
  declare styleDirections: ProjectBriefStyleDirection[];

  @HasMany(() => ProjectBriefReference, 'projectBriefId')
  declare references: ProjectBriefReference[];

  @HasMany(() => ProjectBriefPhase, 'projectBriefId')
  declare phases: ProjectBriefPhase[];

  @HasMany(() => ProjectBriefOccupant, 'projectBriefId')
  declare occupants: ProjectBriefOccupant[];

  @HasMany(() => ProjectBriefAttachment, 'projectBriefId')
  declare attachments: ProjectBriefAttachment[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;

  @DeletedAt
  declare deletedAt: Date | null;
}

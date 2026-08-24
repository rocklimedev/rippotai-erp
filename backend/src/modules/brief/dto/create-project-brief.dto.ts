import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import {
  BudgetGstStatus,
  FundingStage,
  MaintenanceAppetite,
  ProjectBriefStatus,
  SiteAreaUnit,
  SiteCondition,
  SiteType,
  StartDateStatus,
} from '@/common/types/project-brief.types';

export class ProjectBriefDocumentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum([
    'SANCTIONED_PLAN',
    'ARCHITECTURAL_DRAWINGS',
    'STRUCTURAL_DRAWINGS',
    'MEP_LAYOUT',
    'COMPLETION_CERTIFICATE',
    'SOCIETY_NOC',
    'PREVIOUS_DESIGNER_FILES',
    'NOTHING_AVAILABLE',
    'OTHER',
  ])
  documentType: string;

  @IsOptional()
  @IsString()
  documentName?: string;

  @IsOptional()
  @IsString()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProjectBriefWorkTypeDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum(['TURNKEY', 'CONSULTANCY', 'BUILDER_FINANCE', 'PMC_WORK', 'OTHER'])
  workType: string;
}

export class ProjectBriefServiceDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum([
    'ARCHITECTURE_DESIGN',
    'INTERIOR_DESIGN',
    'EXECUTION',
    'LABOUR_WORK',
    'LANDSCAPE_DESIGN',
    'MATERIAL_PROCUREMENT',
    'OTHER',
  ])
  serviceType: string;
}

export class ProjectBriefProcurementCategoryDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  otherDescription?: string;
}

export class ProjectBriefSpaceRequirementDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsString()
  spaceName: string;

  @IsOptional()
  @IsString()
  requirementDetails?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProjectBriefStyleDirectionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  styleDirection: string;

  @IsOptional()
  @IsString()
  otherDescription?: string;
}

export class ProjectBriefReferenceDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  referenceUrl?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class ProjectBriefPhaseDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsString()
  phaseName: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  expectedTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProjectBriefOccupantDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  specificNeedsPreferences?: string;
}

export class ProjectBriefAttachmentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsEnum(['DRAWING', 'DOCUMENT', 'REFERENCE', 'PHOTO', 'OTHER'])
  category: string;

  @IsString()
  name: string;

  @IsString()
  fileUrl: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;
}

export class CreateProjectBriefDto {
  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsString()
  relationshipToClient?: string;

  @IsOptional()
  @IsString()
  referredBySource?: string;

  @IsOptional()
  @IsDateString()
  briefDate?: string;

  // Site

  @IsOptional()
  @IsString()
  siteAddress?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsNumber()
  siteArea?: number;

  @IsOptional()
  @IsEnum(SiteAreaUnit)
  siteAreaUnit?: SiteAreaUnit;

  @IsOptional()
  @IsString()
  siteAreaOtherUnit?: string;

  @IsOptional()
  @IsString()
  facingOrientation?: string;

  @IsOptional()
  @IsString()
  parkingProvision?: string;

  @IsOptional()
  @IsString()
  ownershipStatus?: string;

  @IsOptional()
  @IsNumber()
  numberOfFloors?: number;

  @IsOptional()
  @IsBoolean()
  liftAvailable?: boolean;

  @IsOptional()
  @IsEnum(SiteType)
  siteType?: SiteType;

  @IsOptional()
  @IsString()
  siteTypeOther?: string;

  @IsOptional()
  @IsEnum(SiteCondition)
  siteCondition?: SiteCondition;

  @IsOptional()
  @IsString()
  drawingsOther?: string;

  // Scope

  @IsOptional()
  @IsString()
  workTypeOther?: string;

  @IsOptional()
  @IsString()
  servicesOther?: string;

  @IsOptional()
  @IsString()
  areasIncludedInScope?: string;

  @IsOptional()
  @IsString()
  areasExcludedFromScope?: string;

  @IsOptional()
  @IsString()
  workAlreadyDoneByOthers?: string;

  // Design

  @IsOptional()
  @IsString()
  vastuRequirements?: string;

  @IsOptional()
  @IsString()
  coloursToAvoid?: string;

  @IsOptional()
  @IsString()
  materialsLiked?: string;

  @IsOptional()
  @IsString()
  materialsDislikedHardNo?: string;

  @IsOptional()
  @IsString()
  mustHaveElements?: string;

  @IsOptional()
  @IsString()
  coloursPreferred?: string;

  @IsOptional()
  @IsEnum(MaintenanceAppetite)
  maintenanceAppetite?: MaintenanceAppetite;

  // Budget

  @IsOptional()
  @IsNumber()
  initialClientBudget?: number;

  @IsOptional()
  @IsString()
  budgetCurrency?: string;

  @IsOptional()
  @IsEnum(BudgetGstStatus)
  budgetGstStatus?: BudgetGstStatus;

  @IsOptional()
  @IsEnum(FundingStage)
  fundingStage?: FundingStage;

  @IsOptional()
  @IsString()
  budgetFlexibility?: string;

  // Timeline

  @IsOptional()
  @IsDateString()
  desiredStartDate?: string;

  @IsOptional()
  @IsEnum(StartDateStatus)
  startDateStatus?: StartDateStatus;

  @IsOptional()
  @IsDateString()
  siteHandoverDate?: string;

  @IsOptional()
  @IsDateString()
  targetCompletionDate?: string;

  @IsOptional()
  @IsString()
  deadlineReason?: string;

  @IsOptional()
  @IsBoolean()
  phasingRequired?: boolean;

  // Site operations

  @IsOptional()
  @IsString()
  societyRwaPermittedWorkTimings?: string;

  @IsOptional()
  @IsString()
  nocOrSecurityDepositRequired?: string;

  @IsOptional()
  @IsString()
  structuralChangesPermitted?: string;

  @IsOptional()
  @IsString()
  materialMovementRestrictions?: string;

  @IsOptional()
  @IsString()
  neighbourSensitivities?: string;

  @IsOptional()
  @IsString()
  powerAndWaterAvailability?: string;

  @IsOptional()
  @IsString()
  accessStorageDebrisDisposal?: string;

  @IsOptional()
  @IsString()
  ongoingWorkByOtherAgencies?: string;

  @IsOptional()
  @IsString()
  householdNotes?: string;

  @IsOptional()
  @IsString()
  openPointsToClose?: string;

  @IsOptional()
  @IsUUID()
  briefTakenBy?: string;

  @IsOptional()
  @IsDateString()
  briefTakenDate?: string;

  @IsOptional()
  @IsUUID()
  confirmedByUserId?: string;

  @IsOptional()
  @IsDateString()
  confirmedDate?: string;

  @IsOptional()
  @IsEnum(ProjectBriefStatus)
  status?: ProjectBriefStatus;

  @IsOptional()
  @IsNumber()
  version?: number;

  // Nested

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefDocumentDto)
  documents?: ProjectBriefDocumentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefWorkTypeDto)
  workTypes?: ProjectBriefWorkTypeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefServiceDto)
  services?: ProjectBriefServiceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefProcurementCategoryDto)
  procurementCategories?: ProjectBriefProcurementCategoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefSpaceRequirementDto)
  spaceRequirements?: ProjectBriefSpaceRequirementDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefStyleDirectionDto)
  styleDirections?: ProjectBriefStyleDirectionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefReferenceDto)
  references?: ProjectBriefReferenceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefPhaseDto)
  phases?: ProjectBriefPhaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefOccupantDto)
  occupants?: ProjectBriefOccupantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectBriefAttachmentDto)
  attachments?: ProjectBriefAttachmentDto[];
}

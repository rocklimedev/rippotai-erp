import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { ProjectBrief } from '../../brief/models/project-brief.model';
import { ProjectBriefDocument } from '../../brief/models/project-brief-document.model';
import { ProjectBriefWorkType } from '../../brief/models/project-brief-work-type.model';
import { ProjectBriefService } from '../../brief/models/project-brief-service.model';
import { ProjectBriefProcurementCategory } from '../../brief/models/project-brief-procurement-category.model';
import { ProjectBriefSpaceRequirement } from '../../brief/models/project-brief-space-requirement.model';
import { ProjectBriefStyleDirection } from '../../brief/models/project-brief-style-direction.model';
import { ProjectBriefReference } from '../../brief/models/project-bref-reference.model';
import { ProjectBriefPhase } from '../../brief/models/project-bref-phase.model';
import { ProjectBriefOccupant } from '../../brief/models/project-brief-occupant.model';
import { ProjectBriefAttachment } from '../../brief/models/project-brief-attachment.model';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

@Injectable()
export class BriefSearchService {
  private readonly logger = new Logger(BriefSearchService.name);

  private readonly INDEX = 'project_briefs';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(ProjectBrief)
    private readonly briefModel: typeof ProjectBrief,
  ) {}

  // =========================================================
  // FLATTEN VALUE
  // =========================================================

  private flattenValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.flattenValue(item))
        .filter(Boolean)
        .join(' ');
    }

    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([key, val]) => {
          const flattened = this.flattenValue(val);

          return flattened ? `${key} ${flattened}` : key;
        })
        .filter(Boolean)
        .join(' ');
    }

    return '';
  }

  // =========================================================
  // FLATTEN CHILD COLLECTION
  // =========================================================

  private flattenChildren(items: any[] = []): string {
    return items
      .map((item) => {
        const data = typeof item?.toJSON === 'function' ? item.toJSON() : item;

        return this.flattenValue(data);
      })
      .filter(Boolean)
      .join(' ');
  }

  // =========================================================
  // BUILD SEARCHABLE CONTENT
  // =========================================================

  private buildSearchableContent(brief: ProjectBrief): string {
    const data =
      typeof brief.toJSON === 'function' ? brief.toJSON() : (brief as any);

    const values: string[] = [];

    // -------------------------------------------------------
    // MASTER BRIEF
    // -------------------------------------------------------

    const masterFields = {
      relationshipToClient: data.relationshipToClient,
      referredBySource: data.referredBySource,

      briefDate: data.briefDate,

      siteAddress: data.siteAddress,
      propertyType: data.propertyType,
      siteArea: data.siteArea,
      siteAreaUnit: data.siteAreaUnit,
      siteAreaOtherUnit: data.siteAreaOtherUnit,
      facingOrientation: data.facingOrientation,

      parkingProvision: data.parkingProvision,
      ownershipStatus: data.ownershipStatus,
      numberOfFloors: data.numberOfFloors,
      liftAvailable: data.liftAvailable,

      siteType: data.siteType,
      siteTypeOther: data.siteTypeOther,
      siteCondition: data.siteCondition,

      drawingsOther: data.drawingsOther,

      workTypeOther: data.workTypeOther,
      servicesOther: data.servicesOther,

      areasIncludedInScope: data.areasIncludedInScope,
      areasExcludedFromScope: data.areasExcludedFromScope,
      workAlreadyDoneByOthers: data.workAlreadyDoneByOthers,

      vastuRequirements: data.vastuRequirements,
      coloursToAvoid: data.coloursToAvoid,
      materialsLiked: data.materialsLiked,
      materialsDislikedHardNo: data.materialsDislikedHardNo,
      mustHaveElements: data.mustHaveElements,
      coloursPreferred: data.coloursPreferred,
      maintenanceAppetite: data.maintenanceAppetite,

      initialClientBudget: data.initialClientBudget,
      budgetCurrency: data.budgetCurrency,
      budgetGstStatus: data.budgetGstStatus,
      fundingStage: data.fundingStage,
      budgetFlexibility: data.budgetFlexibility,

      desiredStartDate: data.desiredStartDate,
      startDateStatus: data.startDateStatus,
      siteHandoverDate: data.siteHandoverDate,
      targetCompletionDate: data.targetCompletionDate,
      deadlineReason: data.deadlineReason,
      phasingRequired: data.phasingRequired,

      societyRwaPermittedWorkTimings: data.societyRwaPermittedWorkTimings,

      nocOrSecurityDepositRequired: data.nocOrSecurityDepositRequired,

      structuralChangesPermitted: data.structuralChangesPermitted,

      materialMovementRestrictions: data.materialMovementRestrictions,

      neighbourSensitivities: data.neighbourSensitivities,

      powerAndWaterAvailability: data.powerAndWaterAvailability,

      accessStorageDebrisDisposal: data.accessStorageDebrisDisposal,

      ongoingWorkByOtherAgencies: data.ongoingWorkByOtherAgencies,

      householdNotes: data.householdNotes,
      openPointsToClose: data.openPointsToClose,

      briefTakenBy: data.briefTakenBy,
      briefTakenDate: data.briefTakenDate,

      status: data.status,
      version: data.version,
    };

    values.push(this.flattenValue(masterFields));

    // -------------------------------------------------------
    // CHILD COLLECTIONS
    // -------------------------------------------------------

    values.push(this.flattenChildren((brief as any).documents));

    values.push(this.flattenChildren((brief as any).workTypes));

    values.push(this.flattenChildren((brief as any).services));

    values.push(this.flattenChildren((brief as any).procurementCategories));

    values.push(this.flattenChildren((brief as any).spaceRequirements));

    values.push(this.flattenChildren((brief as any).styleDirections));

    values.push(this.flattenChildren((brief as any).references));

    values.push(this.flattenChildren((brief as any).phases));

    values.push(this.flattenChildren((brief as any).occupants));

    values.push(this.flattenChildren((brief as any).attachments));

    return values.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  // =========================================================
  // CONVERT MODEL → ELASTICSEARCH DOCUMENT
  // =========================================================

  private toDocument(brief: ProjectBrief) {
    const data =
      typeof brief.toJSON === 'function' ? brief.toJSON() : (brief as any);

    const project = (brief as any).project;
    const creator = (brief as any).creator;

    return {
      id: brief.id,

      project_id: data.projectId,

      version: data.version,
      status: data.status,

      brief_date: data.briefDate,

      relationship_to_client: data.relationshipToClient,
      referred_by_source: data.referredBySource,

      site_address: data.siteAddress,
      property_type: data.propertyType,

      site_area: data.siteArea,
      site_area_unit: data.siteAreaUnit,

      facing_orientation: data.facingOrientation,

      parking_provision: data.parkingProvision,
      ownership_status: data.ownershipStatus,
      number_of_floors: data.numberOfFloors,
      lift_available: data.liftAvailable,

      site_type: data.siteType,
      site_condition: data.siteCondition,

      initial_client_budget: data.initialClientBudget,
      budget_currency: data.budgetCurrency,
      budget_gst_status: data.budgetGstStatus,
      funding_stage: data.fundingStage,
      budget_flexibility: data.budgetFlexibility,

      desired_start_date: data.desiredStartDate,
      start_date_status: data.startDateStatus,
      site_handover_date: data.siteHandoverDate,
      target_completion_date: data.targetCompletionDate,

      phasing_required: data.phasingRequired,

      project: project?.name ?? '',

      created_by: creator?.name ?? creator?.fullName ?? creator?.email ?? '',

      searchable_content: this.buildSearchableContent(brief),

      created_at: data.createdAt,
      updated_at: data.updatedAt,
    };
  }

  // =========================================================
  // COMMON INCLUDE
  // =========================================================

  private getIncludes() {
    return [
      {
        model: Project,
        as: 'project',
      },
      {
        model: User,
        as: 'creator',
      },

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
    ];
  }

  // =========================================================
  // INDEX ONE
  // =========================================================

  async indexBrief(id: string) {
    const brief = await this.briefModel.findByPk(id, {
      include: this.getIncludes(),
    });

    if (!brief) {
      this.logger.warn(`Project Brief ${id} not found. Skipping indexing.`);

      return;
    }

    await this.searchService.index(
      this.INDEX,
      brief.id,
      this.toDocument(brief),
    );

    this.logger.log(`Indexed Project Brief ${brief.id}`);
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async updateBrief(id: string) {
    return this.indexBrief(id);
  }

  // =========================================================
  // DELETE
  // =========================================================

  async removeBrief(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Project Brief ${id}`);
  }

  // =========================================================
  // SEARCH
  // =========================================================

  async search(query: string) {
    const trimmedQuery = query?.trim();

    if (!trimmedQuery) {
      return {
        hits: [],
        total: 0,
      };
    }

    return this.searchService.search(this.INDEX, {
      bool: {
        should: [
          // Exact-ish/high priority fields
          {
            multi_match: {
              query: trimmedQuery,
              fields: [
                'site_address^8',
                'project^8',
                'relationship_to_client^4',
                'property_type^4',
                'status^3',
                'budget_currency^2',
              ],
              fuzziness: 'AUTO',
            },
          },

          // Full Project Brief content
          {
            match: {
              searchable_content: {
                query: trimmedQuery,
                fuzziness: 'AUTO',
              },
            },
          },
        ],
        minimum_should_match: 1,
      },
    });
  }

  // =========================================================
  // REINDEX ALL
  // =========================================================

  async reindexAll() {
    const briefs = await this.briefModel.findAll({
      include: this.getIncludes(),
    });

    let indexed = 0;

    for (const brief of briefs) {
      try {
        await this.searchService.index(
          this.INDEX,
          brief.id,
          this.toDocument(brief),
        );

        indexed++;
      } catch (error) {
        this.logger.error(
          `Failed to index Project Brief ${brief.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    this.logger.log(`Indexed ${indexed}/${briefs.length} Project Briefs`);

    return {
      total: briefs.length,
      indexed,
      failed: briefs.length - indexed,
    };
  }
}

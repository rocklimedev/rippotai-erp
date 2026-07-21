import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { SiteRecce } from '../../reki/models/site-recce.model';
import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';
import { Document } from '@/modules/documents/models/document.model';
import { SiteRecceFloor } from '../../reki/models/site-recce-floor.model';
import { SiteLayoutAttachment } from '../../reki/models/site-layout-attachment.model';
import { SiteRecceDocument } from '../../reki/models/site-recce-document.model';

@Injectable()
export class SiteRecceSearchService {
  private readonly logger = new Logger(SiteRecceSearchService.name);

  private readonly INDEX = 'site_recce';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(SiteRecce)
    private readonly siteRecceModel: typeof SiteRecce,
  ) {}

  /**
   * Convert SiteRecce model into Elasticsearch document
   */
  private toDocument(recce: SiteRecce) {
    return {
      id: recce.id,

      project_id: recce.project_id,
      project: recce.project?.name ?? '',

      status: recce.status,
      remarks: recce.remarks,

      recce_date: recce.recce_date,
      time_of_visit: recce.time_of_visit,

      supervisor: recce.supervisor?.name ?? '',

      site_accessibility: recce.site_accessibility,
      road_width_near_site: recce.road_width_near_site,
      vehicle_entry_available: recce.vehicle_entry_available,
      loading_unloading_space: recce.loading_unloading_space,
      lift_available: recce.lift_available,
      service_lift_available: recce.service_lift_available,
      staircase_width: recce.staircase_width,
      floor_level: recce.floor_level,
      parking_availability: recce.parking_availability,
      access_restrictions: recce.access_restrictions,

      current_site_status: recce.current_site_status,
      existing_flooring_condition: recce.existing_flooring_condition,
      existing_wall_condition: recce.existing_wall_condition,
      existing_ceiling_condition: recce.existing_ceiling_condition,
      existing_doors_windows_condition: recce.existing_doors_windows_condition,
      leakage_dampness_observed: recce.leakage_dampness_observed,
      cracks_observed: recce.cracks_observed,

      existing_points_available: recce.existing_points_available,
      main_db_location: recce.main_db_location,
      meter_location: recce.meter_location,
      power_supply_status: recce.power_supply_status,

      water_supply_available: recce.water_supply_available,
      drainage_line_available: recce.drainage_line_available,
      existing_plumbing_condition: recce.existing_plumbing_condition,
      kitchen_plumbing_checked: recce.kitchen_plumbing_checked,
      bathroom_plumbing_checked: recce.bathroom_plumbing_checked,

      floors_count: recce.floors?.length ?? 0,
      attachments_count: recce.layoutAttachments?.length ?? 0,
      documents_count: recce.documents?.length ?? 0,

      created_by: recce.createdBy?.name ?? '',
      updated_by: recce.updatedBy?.name ?? '',

      created_at: recce.createdAt,
      updated_at: recce.updatedAt,
    };
  }

  /**
   * Index one Site Recce
   */
  async indexSiteRecce(id: string) {
    const recce = await this.siteRecceModel.findByPk(id, {
      include: [
        {
          model: Project,
        },
        {
          model: Document,
        },
        {
          model: User,
          as: 'supervisor',
        },
        {
          model: User,
          as: 'createdBy',
        },
        {
          model: User,
          as: 'updatedBy',
        },
        {
          model: SiteRecceFloor,
        },
        {
          model: SiteLayoutAttachment,
        },
        {
          model: SiteRecceDocument,
        },
      ],
    });

    if (!recce) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      recce.id,
      this.toDocument(recce),
    );

    this.logger.log(`Indexed Site Recce ${recce.id}`);
  }

  /**
   * Update Elasticsearch document
   */
  async updateSiteRecce(id: string) {
    return this.indexSiteRecce(id);
  }

  /**
   * Remove from Elasticsearch
   */
  async removeSiteRecce(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Site Recce ${id}`);
  }

  /**
   * Search Site Recce
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'project^6',
          'supervisor^5',
          'remarks^4',
          'status^3',
          'site_accessibility',
          'current_site_status',
          'road_width_near_site',
          'main_db_location',
          'meter_location',
          'access_restrictions',
          'existing_flooring_condition',
          'existing_wall_condition',
          'existing_ceiling_condition',
          'existing_doors_windows_condition',
          'leakage_dampness_observed',
          'cracks_observed',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all Site Recce records
   */
  async reindexAll() {
    const recceList = await this.siteRecceModel.findAll({
      include: [
        {
          model: Project,
        },
        {
          model: Document,
        },
        {
          model: User,
          as: 'supervisor',
        },
        {
          model: User,
          as: 'createdBy',
        },
        {
          model: User,
          as: 'updatedBy',
        },
        {
          model: SiteRecceFloor,
        },
        {
          model: SiteLayoutAttachment,
        },
        {
          model: SiteRecceDocument,
        },
      ],
    });

    for (const recce of recceList) {
      await this.searchService.index(
        this.INDEX,
        recce.id,
        this.toDocument(recce),
      );
    }

    this.logger.log(`Indexed ${recceList.length} Site Recce records`);
  }
}

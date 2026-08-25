import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { SiteRecce } from '@/modules/reki/models/site-recce.model';
import { SiteRecceRoom } from '@/modules/reki/models/site-recce-room.model';
import { SiteReccePhoto } from '@/modules/reki/models/site-recce-photo.model';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

@Injectable()
export class SiteRecceSearchService {
  private readonly logger = new Logger(SiteRecceSearchService.name);

  private readonly INDEX = 'site_recce';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(SiteRecce)
    private readonly siteRecceModel: typeof SiteRecce,
  ) {}

  // ============================================================
  // CONVERT SITE RECCE -> ELASTICSEARCH DOCUMENT
  // ============================================================

  private toDocument(recce: SiteRecce) {
    return {
      id: recce.id,

      // ----------------------------------------------------------
      // PROJECT
      // ----------------------------------------------------------

      project_id: recce.project_id,
      project_name: recce.project_name,
      project: recce.project?.name ?? '',

      // ----------------------------------------------------------
      // CLIENT / SITE
      // ----------------------------------------------------------

      client_name: recce.client_name,
      site_address: recce.site_address,

      // ----------------------------------------------------------
      // RECCE
      // ----------------------------------------------------------

      recce_date: recce.recce_date,

      site_engineer_id: recce.site_engineer_id,
      site_engineer: recce.site_engineer?.name ?? '',

      accompanied_by: recce.accompanied_by,

      // ----------------------------------------------------------
      // PROPERTY
      // ----------------------------------------------------------

      unit_floor_no: recce.unit_floor_no,

      carpet_area_sqft: recce.carpet_area_sqft,
      built_up_area_sqft: recce.built_up_area_sqft,

      number_of_rooms: recce.number_of_rooms,
      number_of_floors: recce.number_of_floors,

      site_type: recce.site_type,

      // ----------------------------------------------------------
      // ACCESS
      // ----------------------------------------------------------

      lift_available: recce.lift_available,
      lift_size: recce.lift_size,
      staircase_width: recce.staircase_width,
      material_entry_point: recce.material_entry_point,

      // ----------------------------------------------------------
      // UTILITIES
      // ----------------------------------------------------------

      water_connection: recce.water_connection,
      power_load_available: recce.power_load_available,
      drainage_point_location: recce.drainage_point_location,

      // ----------------------------------------------------------
      // SOCIETY / RWA
      // ----------------------------------------------------------

      society_rwa_restrictions: recce.society_rwa_restrictions,
      working_hours_allowed: recce.working_hours_allowed,
      material_movement_rule: recce.material_movement_rule,

      // ----------------------------------------------------------
      // EXISTING CONDITION
      // ----------------------------------------------------------

      existing_condition: recce.existing_condition,

      // ----------------------------------------------------------
      // COUNTS
      // ----------------------------------------------------------

      rooms_count: recce.rooms?.length ?? 0,
      photos_count: recce.photos?.length ?? 0,

      // ----------------------------------------------------------
      // AUDIT
      // ----------------------------------------------------------

      created_by: recce.creator?.name ?? '',
      updated_by: recce.updater?.name ?? '',

      created_at: recce.createdAt,
      updated_at: recce.updatedAt,
    };
  }

  // ============================================================
  // INDEX ONE SITE RECCE
  // ============================================================

  async indexSiteRecce(id: string) {
    const recce = await this.siteRecceModel.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
        },

        {
          model: User,
          as: 'site_engineer',
        },

        {
          model: User,
          as: 'creator',
        },

        {
          model: User,
          as: 'updater',
        },

        {
          model: SiteRecceRoom,
          as: 'rooms',
        },

        {
          model: SiteReccePhoto,
          as: 'photos',
        },
      ],
    });

    if (!recce) {
      this.logger.warn(`Site Recce ${id} not found`);
      return;
    }

    await this.searchService.index(
      this.INDEX,
      recce.id,
      this.toDocument(recce),
    );

    this.logger.log(`Indexed Site Recce ${recce.id}`);
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async updateSiteRecce(id: string) {
    return this.indexSiteRecce(id);
  }

  // ============================================================
  // DELETE
  // ============================================================

  async removeSiteRecce(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Site Recce ${id}`);
  }

  // ============================================================
  // SEARCH
  // ============================================================

  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,

        fields: [
          'project^6',
          'project_name^5',
          'client_name^5',
          'site_address^4',
          'site_engineer^5',
          'accompanied_by^3',

          'site_type^3',
          'unit_floor_no',

          'material_entry_point',
          'water_connection',
          'power_load_available',
          'drainage_point_location',

          'society_rwa_restrictions',
          'working_hours_allowed',
          'material_movement_rule',

          'existing_condition^3',
        ],

        fuzziness: 'AUTO',
      },
    });
  }

  // ============================================================
  // REINDEX ALL
  // ============================================================

  async reindexAll() {
    const recceList = await this.siteRecceModel.findAll({
      include: [
        {
          model: Project,
          as: 'project',
        },

        {
          model: User,
          as: 'site_engineer',
        },

        {
          model: User,
          as: 'creator',
        },

        {
          model: User,
          as: 'updater',
        },

        {
          model: SiteRecceRoom,
          as: 'rooms',
        },

        {
          model: SiteReccePhoto,
          as: 'photos',
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

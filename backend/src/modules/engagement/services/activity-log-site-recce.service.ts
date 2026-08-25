import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { ActivityLog } from '../models/activity-log.model';
import { ActivityAction } from '@/common/enums';

import { SiteRecce } from '@/modules/reki/models/site-recce.model';

@Injectable()
export class ActivityLogForSiteRecceService {
  constructor(
    @InjectModel(ActivityLog)
    private readonly activityLogModel: typeof ActivityLog,
  ) {}

  // ============================================================
  // SITE RECCE CREATED
  // ============================================================

  async logSiteRecceCreated(recce: SiteRecce, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',

      action: ActivityAction.SITE_RECCE_CREATED,

      entity_type: 'SiteRecce',
      entity_id: recce.id,
      entity_label: `Recce ${recce.id}`,

      changes: {
        project_id: recce.project_id,
        project_name: recce.project_name,
        client_name: recce.client_name,
        site_address: recce.site_address,

        recce_date: recce.recce_date,

        site_engineer_id: recce.site_engineer_id,
        accompanied_by: recce.accompanied_by,

        unit_floor_no: recce.unit_floor_no,

        carpet_area_sqft: recce.carpet_area_sqft,
        built_up_area_sqft: recce.built_up_area_sqft,

        number_of_rooms: recce.number_of_rooms,
        number_of_floors: recce.number_of_floors,

        site_type: recce.site_type,
      },

      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  // ============================================================
  // SITE RECCE UPDATED
  // ============================================================

  async logSiteRecceUpdated(recce: SiteRecce, user?: any): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',

      action: ActivityAction.SITE_RECCE_UPDATED,

      entity_type: 'SiteRecce',
      entity_id: recce.id,
      entity_label: `Recce ${recce.id}`,

      changes: {
        project_id: recce.project_id,
        project_name: recce.project_name,
        client_name: recce.client_name,
        site_address: recce.site_address,

        recce_date: recce.recce_date,

        site_engineer_id: recce.site_engineer_id,
        accompanied_by: recce.accompanied_by,

        unit_floor_no: recce.unit_floor_no,

        carpet_area_sqft: recce.carpet_area_sqft,
        built_up_area_sqft: recce.built_up_area_sqft,

        number_of_rooms: recce.number_of_rooms,
        number_of_floors: recce.number_of_floors,

        site_type: recce.site_type,

        lift_available: recce.lift_available,
        lift_size: recce.lift_size,
        staircase_width: recce.staircase_width,
        material_entry_point: recce.material_entry_point,

        water_connection: recce.water_connection,
        power_load_available: recce.power_load_available,
        drainage_point_location: recce.drainage_point_location,

        society_rwa_restrictions: recce.society_rwa_restrictions,

        working_hours_allowed: recce.working_hours_allowed,

        material_movement_rule: recce.material_movement_rule,

        existing_condition: recce.existing_condition,

        updated_by: recce.updated_by,
      },

      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }

  // ============================================================
  // SITE RECCE DELETED
  // ============================================================

  async logSiteRecceDeleted(
    recceId: string,
    projectName: string | null,
    user?: any,
  ): Promise<void> {
    await this.activityLogModel.create({
      user_id: user?.id || null,
      user_email: user?.email || 'system',
      user_role: user?.role?.name || 'system',

      action: ActivityAction.SITE_RECCE_DELETED,

      entity_type: 'SiteRecce',
      entity_id: recceId,

      entity_label: `Recce ${recceId} (${projectName || 'Unknown'})`,

      changes: {
        project_name: projectName,
        deleted_by: user?.id || null,
      },

      ip_address: user?.ip_address,
      user_agent: user?.user_agent,
    } as any);
  }
}

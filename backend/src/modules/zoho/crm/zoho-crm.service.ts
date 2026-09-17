import { BadRequestException, Injectable } from '@nestjs/common';

import { ZohoHttpService } from '../services/zoho-http.service';

const ZOHO_BIGIN_BASE_URL = 'https://www.zohoapis.in/bigin/v2';

/**
 * ============================================================
 * DEFAULT FIELDS
 * ============================================================
 *
 * Bigin GET APIs require the `fields` query parameter.
 *
 * If the caller provides:
 *
 * ?fields=id,Deal_Name,Stage
 *
 * that value is preserved.
 *
 * Otherwise we use the module-specific defaults below.
 */
const DEFAULT_FIELDS: Record<string, string> = {
  Contacts: 'id,First_Name,Last_Name,Email,Phone,Account_Name',

  Companies: 'id,Company_Name,Phone,Website',

  Pipelines: [
    'id',
    'Deal_Name',
    'Sub_Pipeline',
    'Stage',
    'Amount',
    'Closing_Date',
    'Contact_Name',
    'Phone',
    'Email',
  ].join(','),

  Tasks: 'id,Subject,Status,Due_Date',

  Events: 'id,Event_Title,Start_DateTime,End_DateTime,Venue',

  Calls: 'id,Subject,Call_Type,Call_Start_Time',

  Products: 'id,Product_Name,Unit_Price',
};

/**
 * Bare minimum fallback for unknown modules.
 */
const FALLBACK_FIELDS = 'id';

@Injectable()
export class ZohoCrmService {
  constructor(private readonly zohoHttpService: ZohoHttpService) {}

  // ============================================================
  // INTERNAL HELPERS
  // ============================================================

  /**
   * Bigin GET endpoints require `fields`.
   *
   * Do not overwrite fields supplied by the caller.
   */
  private withFields(
    module: string,
    params?: Record<string, any>,
  ): Record<string, any> {
    if (params?.fields) {
      return params;
    }

    return {
      ...(params || {}),
      fields: DEFAULT_FIELDS[module] || FALLBACK_FIELDS,
    };
  }

  /**
   * Normalize module name for comparisons.
   *
   * We still send the original module name to Zoho.
   */
  private normalizeModule(module: string): string {
    return String(module || '')
      .trim()
      .toLowerCase();
  }

  /**
   * Validate Bigin Pipeline/Deal payload.
   *
   * Bigin currently requires:
   *
   * - Deal_Name
   * - Sub_Pipeline
   * - Stage
   *
   * The most important one from your current Zoho error is:
   *
   *     Sub_Pipeline
   *
   * Without it Bigin returns:
   *
   *     MANDATORY_NOT_FOUND
   */
  private validatePipelineData(data: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException(
        'Bigin Pipeline data must be a valid object.',
      );
    }

    const payload = {
      ...data,
    };

    // ----------------------------------------------------------
    // Deal Name
    // ----------------------------------------------------------

    if (
      payload.Deal_Name === undefined ||
      payload.Deal_Name === null ||
      String(payload.Deal_Name).trim() === ''
    ) {
      throw new BadRequestException('Bigin Pipelines requires Deal_Name.');
    }

    // ----------------------------------------------------------
    // Sub Pipeline
    // ----------------------------------------------------------

    if (
      payload.Sub_Pipeline === undefined ||
      payload.Sub_Pipeline === null ||
      String(payload.Sub_Pipeline).trim() === ''
    ) {
      throw new BadRequestException(
        'Bigin Pipelines requires Sub_Pipeline. ' +
          'Fetch the available Sub_Pipeline values from ' +
          '/settings/fields?module=Pipelines and provide a valid value.',
      );
    }

    // ----------------------------------------------------------
    // Stage
    // ----------------------------------------------------------

    if (
      payload.Stage === undefined ||
      payload.Stage === null ||
      String(payload.Stage).trim() === ''
    ) {
      throw new BadRequestException('Bigin Pipelines requires Stage.');
    }

    return payload;
  }

  /**
   * Prepare data before create.
   *
   * Only Pipelines receives special Bigin validation.
   */
  private prepareCreateData(
    module: string,
    data: Record<string, any>,
  ): Record<string, any> {
    if (this.normalizeModule(module) === 'pipelines') {
      return this.validatePipelineData(data);
    }

    return {
      ...data,
    };
  }

  /**
   * Prepare data before update.
   *
   * We validate Pipeline fields only when they are supplied.
   *
   * This allows partial updates while still preventing an
   * explicitly empty Sub_Pipeline / Stage / Deal_Name.
   */
  private prepareUpdateData(
    module: string,
    data: Record<string, any>,
  ): Record<string, any> {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException(
        'Bigin update data must be a valid object.',
      );
    }

    if (this.normalizeModule(module) !== 'pipelines') {
      return {
        ...data,
      };
    }

    const payload = {
      ...data,
    };

    if (
      payload.Deal_Name !== undefined &&
      (payload.Deal_Name === null || String(payload.Deal_Name).trim() === '')
    ) {
      throw new BadRequestException('Deal_Name cannot be empty.');
    }

    if (
      payload.Sub_Pipeline !== undefined &&
      (payload.Sub_Pipeline === null ||
        String(payload.Sub_Pipeline).trim() === '')
    ) {
      throw new BadRequestException('Sub_Pipeline cannot be empty.');
    }

    if (
      payload.Stage !== undefined &&
      (payload.Stage === null || String(payload.Stage).trim() === '')
    ) {
      throw new BadRequestException('Stage cannot be empty.');
    }

    return payload;
  }

  /**
   * Prepare multiple create records.
   */
  private prepareCreateRecords(
    module: string,
    data: Record<string, any>[],
  ): Record<string, any>[] {
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Data must be a non-empty array.');
    }

    return data.map((record, index) => {
      try {
        return this.prepareCreateData(module, record);
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw new BadRequestException(
            `Record ${index + 1}: ${error.message}`,
          );
        }

        throw error;
      }
    });
  }

  // ============================================================
  // GENERIC GET RECORDS
  // ============================================================

  async getRecords(
    ownerKey: string,
    module: string,
    params?: Record<string, any>,
  ) {
    return this.zohoHttpService.get(
      ownerKey,
      `/${encodeURIComponent(module)}`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
        },

        params: this.withFields(module, params),
      },
    );
  }

  // ============================================================
  // GET SINGLE RECORD
  // ============================================================

  async getRecord(
    ownerKey: string,
    module: string,
    recordId: string,
    params?: Record<string, any>,
  ) {
    if (!recordId) {
      throw new BadRequestException('Record ID is required.');
    }

    return this.zohoHttpService.get(
      ownerKey,
      `/${encodeURIComponent(module)}/${encodeURIComponent(recordId)}`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
        },

        params: this.withFields(module, params),
      },
    );
  }

  // ============================================================
  // CREATE RECORD
  // ============================================================

  async createRecord(
    ownerKey: string,
    module: string,
    data: Record<string, any>,
  ) {
    const payload = this.prepareCreateData(module, data);

    return this.zohoHttpService.post(
      ownerKey,
      `/${encodeURIComponent(module)}`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },

        data: {
          data: [payload],
        },
      },
    );
  }

  // ============================================================
  // CREATE MULTIPLE RECORDS
  // ============================================================

  async createRecords(
    ownerKey: string,
    module: string,
    data: Record<string, any>[],
  ) {
    const payload = this.prepareCreateRecords(module, data);

    return this.zohoHttpService.post(
      ownerKey,
      `/${encodeURIComponent(module)}`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },

        data: {
          data: payload,
        },
      },
    );
  }

  // ============================================================
  // UPDATE RECORD
  // ============================================================

  async updateRecord(
    ownerKey: string,
    module: string,
    recordId: string,
    data: Record<string, any>,
  ) {
    if (!recordId) {
      throw new BadRequestException('Record ID is required.');
    }

    const payload = this.prepareUpdateData(module, data);

    return this.zohoHttpService.put(
      ownerKey,
      `/${encodeURIComponent(module)}/${encodeURIComponent(recordId)}`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },

        data: {
          data: [payload],
        },
      },
    );
  }

  // ============================================================
  // DELETE RECORD
  // ============================================================

  async deleteRecord(ownerKey: string, module: string, recordId: string) {
    if (!recordId) {
      throw new BadRequestException('Record ID is required.');
    }

    return this.zohoHttpService.delete(
      ownerKey,
      `/${encodeURIComponent(module)}/${encodeURIComponent(recordId)}`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
        },
      },
    );
  }

  // ============================================================
  // SEARCH RECORDS
  // ============================================================

  async searchRecords(
    ownerKey: string,
    module: string,
    params: Record<string, any>,
  ) {
    return this.zohoHttpService.get(
      ownerKey,
      `/${encodeURIComponent(module)}/search`,
      {
        baseURL: ZOHO_BIGIN_BASE_URL,

        headers: {
          Accept: 'application/json',
        },

        params: this.withFields(module, params),
      },
    );
  }

  // ============================================================
  // MODULE METADATA
  // ============================================================

  async getModules(ownerKey: string) {
    return this.zohoHttpService.get(ownerKey, '/settings/modules', {
      baseURL: ZOHO_BIGIN_BASE_URL,

      headers: {
        Accept: 'application/json',
      },
    });
  }

  // ============================================================
  // MODULE FIELDS
  // ============================================================

  async getFields(ownerKey: string, module?: string) {
    const url = module
      ? `/settings/fields?module=${encodeURIComponent(module)}`
      : '/settings/fields';

    return this.zohoHttpService.get(ownerKey, url, {
      baseURL: ZOHO_BIGIN_BASE_URL,

      headers: {
        Accept: 'application/json',
      },
    });
  }

  // ============================================================
  // USERS
  // ============================================================

  async getUsers(ownerKey: string, params?: Record<string, any>) {
    return this.zohoHttpService.get(ownerKey, '/users', {
      baseURL: ZOHO_BIGIN_BASE_URL,

      headers: {
        Accept: 'application/json',
      },

      params,
    });
  }

  // ============================================================
  // ORGANIZATION
  // ============================================================

  async getOrg(ownerKey: string) {
    return this.zohoHttpService.get(ownerKey, '/org', {
      baseURL: ZOHO_BIGIN_BASE_URL,

      headers: {
        Accept: 'application/json',
      },
    });
  }

  // ============================================================
  // CONTACTS
  // ============================================================

  async getContacts(ownerKey: string, params?: Record<string, any>) {
    return this.getRecords(ownerKey, 'Contacts', params);
  }

  async getContact(ownerKey: string, id: string) {
    return this.getRecord(ownerKey, 'Contacts', id);
  }

  async createContact(ownerKey: string, data: Record<string, any>) {
    return this.createRecord(ownerKey, 'Contacts', data);
  }

  async updateContact(ownerKey: string, id: string, data: Record<string, any>) {
    return this.updateRecord(ownerKey, 'Contacts', id, data);
  }

  async deleteContact(ownerKey: string, id: string) {
    return this.deleteRecord(ownerKey, 'Contacts', id);
  }

  // ============================================================
  // COMPANIES
  // Bigin equivalent of CRM Accounts
  // ============================================================

  async getCompanies(ownerKey: string, params?: Record<string, any>) {
    return this.getRecords(ownerKey, 'Companies', params);
  }

  async getCompany(ownerKey: string, id: string) {
    return this.getRecord(ownerKey, 'Companies', id);
  }

  async createCompany(ownerKey: string, data: Record<string, any>) {
    return this.createRecord(ownerKey, 'Companies', data);
  }

  async updateCompany(ownerKey: string, id: string, data: Record<string, any>) {
    return this.updateRecord(ownerKey, 'Companies', id, data);
  }

  async deleteCompany(ownerKey: string, id: string) {
    return this.deleteRecord(ownerKey, 'Companies', id);
  }

  // ============================================================
  // PIPELINES
  // Bigin Deals/Pipelines
  // ============================================================

  async getPipelines(ownerKey: string, params?: Record<string, any>) {
    return this.getRecords(ownerKey, 'Pipelines', params);
  }

  async getPipeline(ownerKey: string, id: string) {
    return this.getRecord(ownerKey, 'Pipelines', id);
  }
  // Add near getFields()

  /**
   * Returns Sub_Pipeline -> Stage[] mapping for the Pipelines module.
   *
   * The flat /settings/fields endpoint does NOT carry this relationship
   * (Stage and Sub_Pipeline picklists come back completely unlinked).
   * The relationship only appears in the Layouts Metadata API, where
   * dependent picklist values carry a `maps` array.
   */
  async getPipelineStageMap(ownerKey: string) {
    const res = await this.zohoHttpService.get(ownerKey, '/settings/layouts', {
      baseURL: ZOHO_BIGIN_BASE_URL,
      headers: { Accept: 'application/json' },
      params: { module: 'Pipelines' },
    });

    const layouts = res?.data?.layouts ?? res?.layouts ?? [];

    const result: Record<
      string,
      { display_value: string; actual_value: string; id: string }[]
    > = {};

    for (const layout of layouts) {
      const sections = layout?.sections ?? [];
      const fields = sections.flatMap((s: any) => s?.fields ?? []);

      const subPipelineField = fields.find((f: any) =>
        ['sub_pipeline', 'pipeline'].includes(
          String(f?.api_name).toLowerCase(),
        ),
      );

      // Each Sub_Pipeline picklist value carries `maps`: an array of field
      // references (here, the Stage field) whose OWN pick_list_values are
      // the stages scoped to that particular sub-pipeline. The map entry
      // itself is metadata about the Stage field, not a stage.
      for (const spVal of subPipelineField?.pick_list_values ?? []) {
        const maps = spVal?.maps;
        if (!Array.isArray(maps) || !maps.length) continue;

        const stageValues = maps.flatMap((m: any) => m?.pick_list_values ?? []);
        if (!stageValues.length) continue;

        result[spVal.display_value] = stageValues.map((s: any) => ({
          display_value: s.display_value,
          actual_value: s.actual_value ?? s.display_value,
          id: s.id,
        }));
      }
    }

    return result;
  }
  async createPipeline(ownerKey: string, data: Record<string, any>) {
    return this.createRecord(ownerKey, 'Pipelines', data);
  }

  async updatePipeline(
    ownerKey: string,
    id: string,
    data: Record<string, any>,
  ) {
    return this.updateRecord(ownerKey, 'Pipelines', id, data);
  }

  async deletePipeline(ownerKey: string, id: string) {
    return this.deleteRecord(ownerKey, 'Pipelines', id);
  }

  // ============================================================
  // TASKS
  // ============================================================

  async getTasks(ownerKey: string, params?: Record<string, any>) {
    return this.getRecords(ownerKey, 'Tasks', params);
  }

  async getTask(ownerKey: string, id: string) {
    return this.getRecord(ownerKey, 'Tasks', id);
  }

  async createTask(ownerKey: string, data: Record<string, any>) {
    return this.createRecord(ownerKey, 'Tasks', data);
  }

  async updateTask(ownerKey: string, id: string, data: Record<string, any>) {
    return this.updateRecord(ownerKey, 'Tasks', id, data);
  }

  async deleteTask(ownerKey: string, id: string) {
    return this.deleteRecord(ownerKey, 'Tasks', id);
  }

  // ============================================================
  // EVENTS
  // ============================================================

  async getEvents(ownerKey: string, params?: Record<string, any>) {
    return this.getRecords(ownerKey, 'Events', params);
  }

  async getEvent(ownerKey: string, id: string) {
    return this.getRecord(ownerKey, 'Events', id);
  }

  async createEvent(ownerKey: string, data: Record<string, any>) {
    return this.createRecord(ownerKey, 'Events', data);
  }

  async updateEvent(ownerKey: string, id: string, data: Record<string, any>) {
    return this.updateRecord(ownerKey, 'Events', id, data);
  }

  async deleteEvent(ownerKey: string, id: string) {
    return this.deleteRecord(ownerKey, 'Events', id);
  }
}

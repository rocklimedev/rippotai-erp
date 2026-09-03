import { Injectable } from '@nestjs/common';
import { ZohoHttpService } from '../services/zoho-http.service';

const ZOHO_BIGIN_BASE_URL = 'https://www.zohoapis.in/bigin/v2';

// Unlike Zoho CRM, Bigin's GET endpoints require an explicit `fields`
// query parameter on every request — it returns 400
// REQUIRED_PARAM_MISSING (param_name: "fields") if it's omitted.
// These are used as a fallback whenever the caller doesn't pass their
// own `fields` param. Callers can always override by passing
// `params.fields` themselves (comma-separated field API names).
const DEFAULT_FIELDS: Record<string, string> = {
  Contacts: 'id,First_Name,Last_Name,Email,Phone,Account_Name',
  Companies: 'id,Company_Name,Phone,Website',
  Pipelines: 'id,Deal_Name,Stage,Amount,Closing_Date,Contact_Name',
  Tasks: 'id,Subject,Status,Due_Date',
  Events: 'id,Event_Title,Start_DateTime,End_DateTime,Venue',
  Calls: 'id,Subject,Call_Type,Call_Start_Time',
  Products: 'id,Product_Name,Unit_Price',
};

// Bare-minimum fallback for any module not listed above.
const FALLBACK_FIELDS = 'id';

@Injectable()
export class ZohoCrmService {
  constructor(private readonly zohoHttpService: ZohoHttpService) {}

  // ============================================================
  // RESOLVE FIELDS PARAM
  // Ensures every GET request Bigin requires a `fields` param for
  // actually has one, without clobbering a caller-supplied value.
  // ============================================================

  private withFields(module: string, params?: Record<string, any>) {
    if (params?.fields) {
      return params;
    }

    return {
      ...(params || {}),
      fields: DEFAULT_FIELDS[module] || FALLBACK_FIELDS,
    };
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
          data: [data],
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
          data,
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
          data: [data],
        },
      },
    );
  }

  // ============================================================
  // DELETE RECORD
  // ============================================================

  async deleteRecord(ownerKey: string, module: string, recordId: string) {
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
  // COMPANIES (Bigin's equivalent of CRM "Accounts")
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
  // PIPELINES (Bigin's equivalent of CRM "Deals")
  // ============================================================

  async getPipelines(ownerKey: string, params?: Record<string, any>) {
    return this.getRecords(ownerKey, 'Pipelines', params);
  }

  async getPipeline(ownerKey: string, id: string) {
    return this.getRecord(ownerKey, 'Pipelines', id);
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

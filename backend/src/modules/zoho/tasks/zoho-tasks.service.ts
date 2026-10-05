// zoho/zoho-tasks.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';

import { ZohoHttpService } from '../services/zoho-http.service';
import { ZohoAuthService } from '@/modules/auth/zoho-auth.service';

import { CreateZohoTaskDto } from './dto/create-task.dto';
import { UpdateZohoTaskDto } from './dto/update-task.dto';

@Injectable()
export class ZohoTasksService {
  /**
   * Zoho Projects classic API host is projectsapi.zoho.<dc>
   * (not www.zohoapis.<dc>).
   */
  private readonly baseUrl = '/restapi/portal';

  constructor(
    private readonly zohoHttpService: ZohoHttpService,
    private readonly zohoAuthService: ZohoAuthService,
  ) {}

  // ---------------------------------------------------------
  // PORTALS
  // ---------------------------------------------------------

  async listPortals(userId: string) {
    this.validateUserId(userId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(userId, '/restapi/portals/', { baseURL });
  }

  // ---------------------------------------------------------
  // PROJECTS
  // ---------------------------------------------------------

  async listProjects(
    userId: string,
    portalId: string,
    params?: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/`,
      { params, baseURL },
    );
  }

  async getProject(userId: string, portalId: string, projectId: string) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/`,
      { baseURL },
    );
  }

  async createProject(
    userId: string,
    portalId: string,
    dto: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    const baseURL = await this.getProjectsBaseUrl(userId);
    const body = this.cleanPayload(dto);

    // Classic: form/query params, not JSON body
    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/`,
      { params: body, baseURL },
    );
  }

  async updateProject(
    userId: string,
    portalId: string,
    projectId: string,
    dto: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);
    const body = this.cleanPayload(dto);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/`,
      { params: body, baseURL },
    );
  }

  async deleteProject(userId: string, portalId: string, projectId: string) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.delete(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/`,
      { baseURL },
    );
  }

  // ---------------------------------------------------------
  // TASKLISTS
  // ---------------------------------------------------------

  async listTasklists(
    userId: string,
    portalId: string,
    projectId: string,
    params?: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    // flag=internal|external is often required by classic API
    const query = {
      flag: params?.flag ?? 'internal',
      ...params,
    };

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasklists/`,
      { params: query, baseURL },
    );
  }

  async createTasklist(
    userId: string,
    portalId: string,
    projectId: string,
    dto: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);

    if (!dto?.name && !dto?.task_template_id) {
      throw new BadRequestException(
        'name is required unless task_template_id is provided',
      );
    }

    const baseURL = await this.getProjectsBaseUrl(userId);
    const body = this.cleanPayload(dto);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasklists/`,
      { params: body, baseURL },
    );
  }

  async updateTasklist(
    userId: string,
    portalId: string,
    projectId: string,
    tasklistId: string,
    dto: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTasklistId(tasklistId);
    const baseURL = await this.getProjectsBaseUrl(userId);
    const body = this.cleanPayload(dto);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasklists/${tasklistId}/`,
      { params: body, baseURL },
    );
  }

  async deleteTasklist(
    userId: string,
    portalId: string,
    projectId: string,
    tasklistId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTasklistId(tasklistId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.delete(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasklists/${tasklistId}/`,
      { baseURL },
    );
  }

  // ---------------------------------------------------------
  // TASKS
  // ---------------------------------------------------------

  async listTasks(
    userId: string,
    portalId: string,
    projectId: string,
    params?: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    // Map app limit/page → classic index/range
    const { limit, page, ...rest } = params ?? {};
    const range = Math.min(Number(limit) || 100, 100);
    const index =
      page != null ? (Number(page) - 1) * range + 1 : Number(rest.index) || 1;

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/`,
      { params: { ...rest, index, range }, baseURL },
    );
  }

  async listTasklistTasks(
    userId: string,
    portalId: string,
    projectId: string,
    tasklistId: string,
    params?: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTasklistId(tasklistId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    const { limit, page, ...rest } = params ?? {};
    const range = Math.min(Number(limit) || 100, 100);
    const index =
      page != null ? (Number(page) - 1) * range + 1 : Number(rest.index) || 1;

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasklists/${tasklistId}/tasks/`,
      { params: { ...rest, index, range }, baseURL },
    );
  }

  async getTask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/`,
      { baseURL },
    );
  }

  async getTaskActivities(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/activities/`,
      { baseURL },
    );
  }

  async createTask(
    userId: string,
    portalId: string,
    projectId: string,
    dto: CreateZohoTaskDto,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    const body = this.toZohoTaskBody(dto as Record<string, any>);
    if (!body.name) {
      throw new BadRequestException('Task name/title is required');
    }

    // Classic Zoho expects params (or form), NOT JSON body → avoids 6831
    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/`,
      { params: body, baseURL },
    );
  }

  async updateTask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
    dto: UpdateZohoTaskDto,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    const body = this.toZohoTaskBody(dto as Record<string, any>);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/`,
      { params: body, baseURL },
    );
  }

  async createSubtask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
    dto: CreateZohoTaskDto,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    const body = this.toZohoTaskBody(dto as Record<string, any>);
    if (!body.name) {
      throw new BadRequestException('Task name/title is required');
    }

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/subtasks/`,
      { params: body, baseURL },
    );
  }

  async deleteTask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.delete(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/`,
      { baseURL },
    );
  }

  async reorderTask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
    dto: Record<string, any>,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);
    const body = this.cleanPayload(dto);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/reorder`,
      { params: body, baseURL },
    );
  }

  async followTask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/follow`,
      { baseURL },
    );
  }

  async unfollowTask(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.post(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/unfollow`,
      { baseURL },
    );
  }

  // ---------------------------------------------------------
  // SUBTASKS
  // ---------------------------------------------------------

  async listSubtasks(
    userId: string,
    portalId: string,
    projectId: string,
    taskId: string,
  ) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    this.validateTaskId(taskId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/${taskId}/subtasks/`,
      { baseURL },
    );
  }

  // ---------------------------------------------------------
  // LAYOUTS / VIEWS
  // ---------------------------------------------------------

  async getTaskLayouts(userId: string, portalId: string, projectId: string) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasklayouts`,
      { baseURL },
    );
  }

  async getTaskViews(userId: string, portalId: string, projectId: string) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    this.validateProjectId(projectId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/projects/${projectId}/tasks/views`,
      { baseURL },
    );
  }

  async getMyTasksViews(userId: string, portalId: string) {
    this.validateUserId(userId);
    this.validatePortalId(portalId);
    const baseURL = await this.getProjectsBaseUrl(userId);

    return this.zohoHttpService.get(
      userId,
      `${this.baseUrl}/${portalId}/mytasks/views`,
      { baseURL },
    );
  }

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  /**
   * Map app DTO → classic Zoho task fields.
   * Classic API wants name, priority (High/Medium/Low/None),
   * end_date as MM-DD-YYYY, person_responsible, tasklist_id, etc.
   */
  private toZohoTaskBody(dto: Record<string, any>) {
    const body: Record<string, any> = {};

    const name = dto.title ?? dto.name;
    if (name) body.name = String(name).trim();

    if (dto.description != null) {
      body.description = dto.description;
    }

    if (dto.priority) {
      const p = String(dto.priority).toLowerCase();
      body.priority =
        p === 'critical' || p === 'high'
          ? 'High'
          : p === 'low'
            ? 'Low'
            : p === 'none'
              ? 'None'
              : 'Medium';
    }

    if (dto.status) {
      const s = String(dto.status).toLowerCase().replace(/-/g, '_');
      if (['completed', 'complete', 'done', 'closed'].includes(s)) {
        body.percent_complete = '100';
      } else if (['in_progress', 'inprogress'].includes(s)) {
        body.percent_complete = '50';
      } else if (s === 'todo' || s === 'open' || s === 'blocked') {
        body.percent_complete = '0';
      }
      // blocked → set custom_status to your portal’s status id if needed
    }

    const due = dto.due_date ?? dto.dueDate;
    if (due) {
      body.end_date = this.formatZohoDate(String(due), dto.timezone);
      body.start_date = this.formatZohoDate(
        String(dto.start_date || due),
        dto.timezone,
      );
    }

    if (dto.reminderDate) {
      body.reminder_string = JSON.stringify({
        reminder: [
          {
            reminder_criteria: 'customdate',
            custom_date: this.formatZohoDate(dto.reminderDate, dto.timezone),
            reminder_time: dto.reminder_time || '09:00',
            reminder_notify_users: 'owner',
          },
        ],
      });
    }

    const person = dto.assignee ?? dto.assignee_id;
    if (person) body.person_responsible = String(person);

    if (dto.tasklist_id) body.tasklist_id = String(dto.tasklist_id);

    return Object.fromEntries(
      Object.entries(body).filter(
        ([, value]) => value !== undefined && value !== null,
      ),
    );
  }

  /** Classic Zoho date: MM-DD-YYYY */
  private formatZohoDate(value: string, timezone?: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      return value;
    }
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'Asia/Kolkata',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).formatToParts(d);
    const mm = parts.find((part) => part.type === 'month')!.value;
    const dd = parts.find((part) => part.type === 'day')!.value;
    const yyyy = parts.find((part) => part.type === 'year')!.value;
    return `${mm}-${dd}-${yyyy}`;
  }

  private async getProjectsBaseUrl(userId: string): Promise<string> {
    const apiDomain = await this.zohoAuthService.getApiDomain(userId);

    if (!apiDomain) {
      throw new BadRequestException(
        `Zoho API domain is missing for this user. ` +
          'Please reconnect the Zoho account.',
      );
    }

    const tld = new URL(apiDomain).hostname.replace(/^(www\.)?zohoapis\./, '');
    if (
      !['com', 'in', 'eu', 'com.au', 'jp', 'com.cn', 'ca', 'sa'].includes(tld)
    ) {
      throw new BadRequestException('Unsupported Zoho account region');
    }

    return `https://projectsapi.zoho.${tld}`;
  }

  private validateUserId(userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
  }

  private validatePortalId(portalId: string) {
    if (!portalId) throw new BadRequestException('portalId is required');
  }

  private validateProjectId(projectId: string) {
    if (!projectId) throw new BadRequestException('projectId is required');
  }

  private validateTasklistId(tasklistId: string) {
    if (!tasklistId) throw new BadRequestException('tasklistId is required');
  }

  private validateTaskId(taskId: string) {
    if (!taskId) throw new BadRequestException('taskId is required');
  }

  private cleanPayload(payload: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(payload ?? {}).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    );
  }
}

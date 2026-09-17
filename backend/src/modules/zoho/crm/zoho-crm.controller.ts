import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { ZohoCrmService } from './zoho-crm.service';

@Controller('zoho/bigin')
export class ZohoCrmController {
  constructor(private readonly ZohoCrmService: ZohoCrmService) {}

  // ============================================================
  // HELPERS — normalize frontend / lead form → Bigin API names
  // ============================================================

  /**
   * Map common camelCase / form keys to Bigin Pipeline field API names.
   *
   * Frontend lead form sends:
   *   { name, subPipeline, stage?, phone, email, ... }
   *
   * Bigin requires:
   *   { Deal_Name, Sub_Pipeline, Stage, ... }
   */
  private normalizePipelineBody(
    body: Record<string, any> = {},
  ): Record<string, any> {
    const payload: Record<string, any> = { ...body };

    // Deal_Name
    if (
      (payload.Deal_Name === undefined ||
        payload.Deal_Name === null ||
        String(payload.Deal_Name).trim() === '') &&
      payload.name !== undefined &&
      payload.name !== null &&
      String(payload.name).trim() !== ''
    ) {
      payload.Deal_Name = String(payload.name).trim();
    }

    // Sub_Pipeline  ← critical fix for the current 400
    if (
      (payload.Sub_Pipeline === undefined ||
        payload.Sub_Pipeline === null ||
        String(payload.Sub_Pipeline).trim() === '') &&
      payload.subPipeline !== undefined &&
      payload.subPipeline !== null &&
      String(payload.subPipeline).trim() !== ''
    ) {
      payload.Sub_Pipeline = String(payload.subPipeline).trim();
    }

    // Also accept snake_case
    if (
      (payload.Sub_Pipeline === undefined ||
        payload.Sub_Pipeline === null ||
        String(payload.Sub_Pipeline).trim() === '') &&
      payload.sub_pipeline !== undefined &&
      payload.sub_pipeline !== null &&
      String(payload.sub_pipeline).trim() !== ''
    ) {
      payload.Sub_Pipeline = String(payload.sub_pipeline).trim();
    }

    // Stage
    if (
      (payload.Stage === undefined ||
        payload.Stage === null ||
        String(payload.Stage).trim() === '') &&
      payload.stage !== undefined &&
      payload.stage !== null &&
      String(payload.stage).trim() !== ''
    ) {
      payload.Stage = String(payload.stage).trim();
    }

    // Optional contact-style fields from the lead form
    if (payload.Phone === undefined && payload.phone) {
      payload.Phone = String(payload.phone).trim();
    }
    if (payload.Email === undefined && payload.email) {
      payload.Email = String(payload.email).trim();
    }

    return payload;
  }

  // ============================================================
  // SETTINGS / SYSTEM ROUTES
  // ============================================================

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/settings/modules
   */
  @Get(':ownerKey/settings/modules')
  getModules(@Param('ownerKey') ownerKey: string) {
    return this.ZohoCrmService.getModules(ownerKey);
  }

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/settings/fields
   * Optional: ?module=Pipelines
   */
  @Get(':ownerKey/settings/fields')
  getFields(
    @Param('ownerKey') ownerKey: string,
    @Query('module') module?: string,
  ) {
    return this.ZohoCrmService.getFields(ownerKey, module);
  }

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/users
   */
  @Get(':ownerKey/users')
  getUsers(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getUsers(ownerKey, query);
  }

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/org
   */
  @Get(':ownerKey/org')
  getOrg(@Param('ownerKey') ownerKey: string) {
    return this.ZohoCrmService.getOrg(ownerKey);
  }

  // ============================================================
  // GENERIC MODULE ROUTES
  // ============================================================

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/modules/:module
   */
  @Get(':ownerKey/modules/:module')
  getRecords(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getRecords(ownerKey, module, query);
  }

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/modules/:module/search
   * Keep BEFORE the :id route.
   */
  @Get(':ownerKey/modules/:module/search')
  searchRecords(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.searchRecords(ownerKey, module, query);
  }

  /**
   * GET /api/v1/zoho/bigin/:ownerKey/modules/:module/:id
   */
  @Get(':ownerKey/modules/:module/:id')
  getRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Param('id') id: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getRecord(ownerKey, module, id, query);
  }

  /**
   * POST /api/v1/zoho/bigin/:ownerKey/modules/:module
   *
   * When module is Pipelines, normalize form keys → Bigin API names.
   */
  @Post(':ownerKey/modules/:module')
  createRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Body() body: Record<string, any>,
  ) {
    const payload =
      String(module || '')
        .trim()
        .toLowerCase() === 'pipelines'
        ? this.normalizePipelineBody(body)
        : body;

    return this.ZohoCrmService.createRecord(ownerKey, module, payload);
  }

  /**
   * POST /api/v1/zoho/bigin/:ownerKey/modules/:module/bulk
   */
  @Post(':ownerKey/modules/:module/bulk')
  createRecords(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Body() body: Record<string, any>,
  ) {
    const raw = Array.isArray(body?.data) ? body.data : [];

    const data =
      String(module || '')
        .trim()
        .toLowerCase() === 'pipelines'
        ? raw.map((row) => this.normalizePipelineBody(row))
        : raw;

    return this.ZohoCrmService.createRecords(ownerKey, module, data);
  }

  /**
   * PUT /api/v1/zoho/bigin/:ownerKey/modules/:module/:id
   */
  @Put(':ownerKey/modules/:module/:id')
  updateRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    const payload =
      String(module || '')
        .trim()
        .toLowerCase() === 'pipelines'
        ? this.normalizePipelineBody(body)
        : body;

    return this.ZohoCrmService.updateRecord(ownerKey, module, id, payload);
  }

  /**
   * DELETE /api/v1/zoho/bigin/:ownerKey/modules/:module/:id
   */
  @Delete(':ownerKey/modules/:module/:id')
  deleteRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Param('id') id: string,
  ) {
    return this.ZohoCrmService.deleteRecord(ownerKey, module, id);
  }

  // ============================================================
  // CONTACTS
  // ============================================================

  @Get(':ownerKey/contacts')
  getContacts(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getContacts(ownerKey, query);
  }

  @Get(':ownerKey/contacts/:id')
  getContact(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.getContact(ownerKey, id);
  }

  @Post(':ownerKey/contacts')
  createContact(
    @Param('ownerKey') ownerKey: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.createContact(ownerKey, body);
  }

  @Put(':ownerKey/contacts/:id')
  updateContact(
    @Param('ownerKey') ownerKey: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.updateContact(ownerKey, id, body);
  }

  @Delete(':ownerKey/contacts/:id')
  deleteContact(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.deleteContact(ownerKey, id);
  }

  // ============================================================
  // COMPANIES
  // ============================================================

  @Get(':ownerKey/companies')
  getCompanies(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getCompanies(ownerKey, query);
  }

  @Get(':ownerKey/companies/:id')
  getCompany(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.getCompany(ownerKey, id);
  }

  @Post(':ownerKey/companies')
  createCompany(
    @Param('ownerKey') ownerKey: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.createCompany(ownerKey, body);
  }

  @Put(':ownerKey/companies/:id')
  updateCompany(
    @Param('ownerKey') ownerKey: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.updateCompany(ownerKey, id, body);
  }

  @Delete(':ownerKey/companies/:id')
  deleteCompany(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.deleteCompany(ownerKey, id);
  }

  // ============================================================
  // PIPELINES / DEALS
  // ============================================================

  @Get(':ownerKey/pipelines')
  getPipelines(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getPipelines(ownerKey, query);
  }

  @Get(':ownerKey/pipelines/:id')
  getPipeline(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.getPipeline(ownerKey, id);
  }

  /**
   * POST /pipelines
   *
   * Accepts either Bigin API names or lead-form camelCase:
   *
   * {
   *   "Deal_Name" | "name": "...",
   *   "Sub_Pipeline" | "subPipeline": "Sales Pipeline Standard",
   *   "Stage" | "stage": "..."
   * }
   */
  @Post(':ownerKey/pipelines')
  createPipeline(
    @Param('ownerKey') ownerKey: string,
    @Body() body: Record<string, any>,
  ) {
    const payload = this.normalizePipelineBody(body);
    return this.ZohoCrmService.createPipeline(ownerKey, payload);
  }
  @Get(':ownerKey/settings/pipeline-stage-map')
  getPipelineStageMap(@Param('ownerKey') ownerKey: string) {
    return this.ZohoCrmService.getPipelineStageMap(ownerKey);
  }
  @Put(':ownerKey/pipelines/:id')
  updatePipeline(
    @Param('ownerKey') ownerKey: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    const payload = this.normalizePipelineBody(body);
    return this.ZohoCrmService.updatePipeline(ownerKey, id, payload);
  }

  @Delete(':ownerKey/pipelines/:id')
  deletePipeline(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.deletePipeline(ownerKey, id);
  }

  // ============================================================
  // TASKS
  // ============================================================

  @Get(':ownerKey/tasks')
  getTasks(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getTasks(ownerKey, query);
  }

  @Get(':ownerKey/tasks/:id')
  getTask(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.getTask(ownerKey, id);
  }

  @Post(':ownerKey/tasks')
  createTask(
    @Param('ownerKey') ownerKey: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.createTask(ownerKey, body);
  }

  @Put(':ownerKey/tasks/:id')
  updateTask(
    @Param('ownerKey') ownerKey: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.updateTask(ownerKey, id, body);
  }

  @Delete(':ownerKey/tasks/:id')
  deleteTask(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.deleteTask(ownerKey, id);
  }

  // ============================================================
  // EVENTS
  // ============================================================

  @Get(':ownerKey/events')
  getEvents(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getEvents(ownerKey, query);
  }

  @Get(':ownerKey/events/:id')
  getEvent(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.getEvent(ownerKey, id);
  }

  @Post(':ownerKey/events')
  createEvent(
    @Param('ownerKey') ownerKey: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.createEvent(ownerKey, body);
  }

  @Put(':ownerKey/events/:id')
  updateEvent(
    @Param('ownerKey') ownerKey: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.updateEvent(ownerKey, id, body);
  }

  @Delete(':ownerKey/events/:id')
  deleteEvent(@Param('ownerKey') ownerKey: string, @Param('id') id: string) {
    return this.ZohoCrmService.deleteEvent(ownerKey, id);
  }
}

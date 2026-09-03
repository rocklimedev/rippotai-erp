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
  // SETTINGS / SYSTEM ROUTES
  // ============================================================

  @Get(':ownerKey/settings/modules')
  getModules(@Param('ownerKey') ownerKey: string) {
    return this.ZohoCrmService.getModules(ownerKey);
  }

  @Get(':ownerKey/settings/fields')
  getFields(
    @Param('ownerKey') ownerKey: string,
    @Query('module') module?: string,
  ) {
    return this.ZohoCrmService.getFields(ownerKey, module);
  }

  @Get(':ownerKey/users')
  getUsers(
    @Param('ownerKey') ownerKey: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getUsers(ownerKey, query);
  }

  @Get(':ownerKey/org')
  getOrg(@Param('ownerKey') ownerKey: string) {
    return this.ZohoCrmService.getOrg(ownerKey);
  }

  // ============================================================
  // MODULE - LIST
  // Bigin requires a `fields` query param on GET requests; if the
  // caller omits it, ZohoCrmService.getRecords falls back to a
  // sensible per-module default.
  // Example:
  // GET /api/zoho/bigin/{ownerKey}/modules/Contacts?fields=id,Email
  // ============================================================

  @Get(':ownerKey/modules/:module')
  getRecords(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getRecords(ownerKey, module, query);
  }

  // ============================================================
  // MODULE - GET ONE
  // Example:
  // GET /api/zoho/bigin/{ownerKey}/modules/Contacts/{id}
  // ============================================================

  @Get(':ownerKey/modules/:module/:id')
  getRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Param('id') id: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.getRecord(ownerKey, module, id, query);
  }

  // ============================================================
  // MODULE - SEARCH
  // Example:
  // GET /api/zoho/bigin/{ownerKey}/modules/Contacts/search
  // ============================================================

  @Get(':ownerKey/modules/:module/search')
  search(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Query() query: Record<string, any>,
  ) {
    return this.ZohoCrmService.searchRecords(ownerKey, module, query);
  }

  // ============================================================
  // MODULE - CREATE
  // ============================================================

  @Post(':ownerKey/modules/:module')
  createRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.createRecord(ownerKey, module, body);
  }

  // ============================================================
  // MODULE - UPDATE
  // ============================================================

  @Put(':ownerKey/modules/:module/:id')
  updateRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.ZohoCrmService.updateRecord(ownerKey, module, id, body);
  }

  // ============================================================
  // MODULE - DELETE
  // ============================================================

  @Delete(':ownerKey/modules/:module/:id')
  deleteRecord(
    @Param('ownerKey') ownerKey: string,
    @Param('module') module: string,
    @Param('id') id: string,
  ) {
    return this.ZohoCrmService.deleteRecord(ownerKey, module, id);
  }
}

// role-apps.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoleAppsService } from './role-apps.service';
import { CreateRoleAppDto, BulkAssignAppsDto } from './dto/role-app.dto';

@Controller('role-apps')
export class RoleAppsController {
  constructor(private readonly roleAppsService: RoleAppsService) {}

  @Post()
  grant(@Body() dto: CreateRoleAppDto) {
    return this.roleAppsService.grant(dto);
  }

  @Post('bulk')
  bulkAssign(@Body() dto: BulkAssignAppsDto) {
    return this.roleAppsService.bulkAssign(dto);
  }

  @Get('matrix')
  getMatrix() {
    return this.roleAppsService.getMatrix();
  }

  @Get()
  findAll(@Query('role_id') role_id?: string) {
    return role_id
      ? this.roleAppsService.findAllForRole(role_id)
      : this.roleAppsService.findAll();
  }

  // Full-replace for a role's app set — the checklist-style admin screen.
  @Put(':role_id')
  setForRole(
    @Param('role_id') role_id: string,
    @Body() dto: { app_codes: string[]; granted_by?: string },
  ) {
    return this.roleAppsService.setForRole(
      role_id,
      dto.app_codes,
      dto.granted_by,
    );
  }

  @Delete(':role_id/:app_code')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('role_id') role_id: string,
    @Param('app_code') app_code: string,
  ) {
    return this.roleAppsService.revoke(role_id, app_code);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import {
  CreateRolePermissionDto,
  BulkAssignPermissionsDto,
} from './dto/role-permission.dto';

@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @Post()
  grant(@Body() dto: CreateRolePermissionDto) {
    return this.rolePermissionsService.grant(dto);
  }

  @Post('bulk')
  bulkAssign(@Body() dto: BulkAssignPermissionsDto) {
    return this.rolePermissionsService.bulkAssign(dto);
  }

  @Get()
  findAll(@Query('role_id') role_id?: string) {
    return role_id
      ? this.rolePermissionsService.findAllForRole(role_id)
      : this.rolePermissionsService.findAll();
  }

  @Delete(':role_id/:permission_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('role_id') role_id: string,
    @Param('permission_id') permission_id: string,
  ) {
    return this.rolePermissionsService.revoke(role_id, permission_id);
  }
}

import { RequirePermission } from '@/common/decorator/require-permission.decorator';
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

  @RequirePermission('role-permissions:grant')
  @Post()
  grant(@Body() dto: CreateRolePermissionDto) {
    return this.rolePermissionsService.grant(dto);
  }
  @RequirePermission('role-permissions:read')
  @Get('matrix')
  getMatrix() {
    return this.rolePermissionsService.getMatrix();
  }
  @RequirePermission('role-permissions:assign')
  @Post('bulk')
  bulkAssign(@Body() dto: BulkAssignPermissionsDto) {
    return this.rolePermissionsService.bulkAssign(dto);
  }

  @RequirePermission('role-permissions:read')
  @Get()
  findAll(@Query('role_id') role_id?: string) {
    return role_id
      ? this.rolePermissionsService.findAllForRole(role_id)
      : this.rolePermissionsService.findAll();
  }

  @RequirePermission('role-permissions:revoke')
  @Delete(':role_id/:permission_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @Param('role_id') role_id: string,
    @Param('permission_id') permission_id: string,
  ) {
    return this.rolePermissionsService.revoke(role_id, permission_id);
  }
}

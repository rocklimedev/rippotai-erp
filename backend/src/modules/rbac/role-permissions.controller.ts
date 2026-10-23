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
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import {
  CreateRolePermissionDto,
  BulkAssignPermissionsDto,
  ApplyPermissionPackageDto,
} from './dto/role-permission.dto';

@Controller('role-permissions')
export class RolePermissionsController {
  constructor(
    private readonly rolePermissionsService: RolePermissionsService,
  ) {}

  @RequirePermission('role-permissions:read')
  @Get('packages')
  getPackages() {
    return this.rolePermissionsService.getPackages();
  }

  @RequirePermission('role-permissions:assign')
  @Post('packages/apply')
  applyPackage(
    @Body() dto: ApplyPermissionPackageDto,
    @CurrentUser() actor: any,
  ) {
    return this.rolePermissionsService.applyPackage(
      dto.role_id,
      dto.package_id,
      actor,
    );
  }

  @RequirePermission('role-permissions:grant')
  @Post()
  grant(@Body() dto: CreateRolePermissionDto, @CurrentUser() actor: any) {
    return this.rolePermissionsService.grant(dto, actor);
  }
  @RequirePermission('role-permissions:read')
  @Get('matrix')
  getMatrix() {
    return this.rolePermissionsService.getMatrix();
  }
  @RequirePermission('role-permissions:assign')
  @Post('bulk')
  bulkAssign(@Body() dto: BulkAssignPermissionsDto, @CurrentUser() actor: any) {
    return this.rolePermissionsService.bulkAssign(dto, actor);
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
    @CurrentUser() actor: any,
  ) {
    return this.rolePermissionsService.revoke(role_id, permission_id, actor);
  }
}

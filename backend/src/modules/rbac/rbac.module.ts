import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { Role } from './models/role.model';
import { Permission } from './models/permission.model';
import { RolePermission } from './models/role_permission.model';
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';
import { RolePermissionsController } from './role-permissions.controller';

import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { RolePermissionsService } from './role-permissions.service';
import { RoleApp } from './models/role-app.model';
import { RoleAppsController } from './role-apps.controller';
import { RoleAppsService } from './role-apps.service';
import { App } from './models/app.model';
import { ActivityLog } from '../engagement/models/activity-log.model';
import { RolePermissionsCacheModule } from './role-permissions-cache';
import { AccessMatrixController } from './access-matrix.controller';
import { AccessMatrixService } from './access-matrix.service';

@Module({
  imports: [
    RolePermissionsCacheModule,
    SequelizeModule.forFeature([
      Role,
      Permission,
      RolePermission,
      RoleApp,
      App,
      ActivityLog,
    ]),
  ],
  controllers: [
    RolesController,
    PermissionsController,
    RolePermissionsController,
    RoleAppsController,
    AccessMatrixController,
  ],
  providers: [
    RolesService,
    PermissionsService,
    RolePermissionsService,
    RoleAppsService,
    AccessMatrixService,
  ],
  exports: [
    RolesService,
    PermissionsService,
    RolePermissionsService,
    RoleAppsService,
    SequelizeModule,
  ],
})
export class RolesModule {}

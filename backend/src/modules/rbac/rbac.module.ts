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

@Module({
  imports: [
    SequelizeModule.forFeature([
      Role,
      Permission,
      RolePermission,
      RoleApp,
      App,
    ]),
  ],
  controllers: [
    RolesController,
    PermissionsController,
    RolePermissionsController,
    RoleAppsController,
  ],
  providers: [
    RolesService,
    PermissionsService,
    RolePermissionsService,
    RoleAppsService,
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

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

@Module({
  imports: [SequelizeModule.forFeature([Role, Permission, RolePermission])],
  controllers: [
    RolesController,
    PermissionsController,
    RolePermissionsController,
  ],
  providers: [RolesService, PermissionsService, RolePermissionsService],
  exports: [
    RolesService,
    PermissionsService,
    RolePermissionsService,
    SequelizeModule,
  ],
})
export class RolesModule {}

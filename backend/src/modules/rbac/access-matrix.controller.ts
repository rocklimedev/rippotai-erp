import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { AccessMatrixService } from './access-matrix.service';
import type { SetAccessDto } from './access-matrix.service';

// Named access levels per app and per document/part, derived from
// role_permissions. See access-catalogue.ts.
@Controller('role-access')
export class AccessMatrixController {
  constructor(private readonly access: AccessMatrixService) {}

  @RequirePermission('role-permissions:read')
  @Get('catalogue')
  catalogue() {
    return this.access.catalogue();
  }

  @RequirePermission('role-permissions:read')
  @Get('app/:code')
  getAppAcrossRoles(@Param('code') code: string) {
    return this.access.getAppAcrossRoles(code);
  }

  @RequirePermission('role-permissions:read')
  @Get(':role_id')
  getForRole(@Param('role_id') roleId: string) {
    return this.access.getForRole(roleId);
  }

  @RequirePermission('role-permissions:assign')
  @Put(':role_id')
  setForRole(
    @Param('role_id') roleId: string,
    @Body() dto: SetAccessDto,
    @CurrentUser() actor: any,
  ) {
    return this.access.setForRole(roleId, dto, actor);
  }
}

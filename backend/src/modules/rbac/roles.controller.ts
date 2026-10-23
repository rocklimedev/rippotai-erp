import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CurrentUser } from '@/common/decorator/current-user.decorator';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('rbac')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermission('rbac:create')
  @Post()
  create(@Body() dto: CreateRoleDto, @CurrentUser() actor: any) {
    return this.rolesService.create(dto, actor);
  }

  @RequirePermission('rbac:read')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @RequirePermission('rbac:read')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @RequirePermission('rbac:update')
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() actor: any,
  ) {
    return this.rolesService.update(id, dto, actor);
  }

  @RequirePermission('rbac:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() actor: any) {
    return this.rolesService.remove(id, actor);
  }
  // roles.controller.ts — add this method
  @RequirePermission('rbac:read')
  @Get(':id/access')
  findOneWithAccess(@Param('id') id: string) {
    return this.rolesService.findOneWithAccess(id);
  }
}

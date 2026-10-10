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
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Controller('rbac')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @RequirePermission('rbac:create')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
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
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @RequirePermission('rbac:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
  // roles.controller.ts — add this method
  @RequirePermission('rbac:read')
  @Get(':id/access')
  findOneWithAccess(@Param('id') id: string) {
    return this.rolesService.findOneWithAccess(id);
  }
}

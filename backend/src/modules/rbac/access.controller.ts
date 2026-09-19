import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { IsIn, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { AccessRuleModel } from './models/access-rule.model';
import { AccessService } from './access.service';
import { Role } from './models/role.model';
import { User } from '../users/models/user.model';
import { isSuperadmin } from './access-policy';
import { ProjectScopeService } from './project-scope.service';

export class AccessRuleDto {
  @IsIn(['USER', 'ROLE']) subject_type: 'USER' | 'ROLE';
  @IsUUID() subject_id: string;
  @IsString()
  @MaxLength(255)
  @Matches(/^(route:\/[^?#]*|[a-zA-Z0-9_*-]+)$/)
  resource: string;
  @IsString()
  @MaxLength(50)
  @Matches(/^(?:[a-z][a-z0-9_-]*|\*)$/)
  action: string;
  @IsIn(['ALLOW', 'DENY']) effect: 'ALLOW' | 'DENY';
}

@Controller('access')
export class AccessController {
  constructor(
    private readonly access: AccessService,
    private readonly scopes: ProjectScopeService,
  ) {}

  @Get('roles')
  async roles(@Query('scope') scope = 'PROJECT') {
    if (!['INTERNAL', 'PROJECT'].includes(scope))
      throw new BadRequestException('Invalid role scope');
    return Role.findAll({
      where: { scope },
      attributes: ['id', 'name', 'scope'],
      order: [['name', 'ASC']],
    });
  }

  @Get('check')
  async check(
    @Req() req: any,
    @Query('path') path: string,
    @Query('project_id') projectId?: string,
  ) {
    if (!path?.startsWith('/') || path.includes('?') || path.includes('#')) {
      throw new BadRequestException('A route pathname is required');
    }
    const routeOwners: Record<string, string> = {
      '/projects/': 'projects',
      '/projects/planner/': 'project_planners',
      '/ledger/boq/': 'boqs',
      '/ledger/budget-estimate/': 'budget_estimates',
      '/ledger/payment-schedule/': 'payment_schedules',
      '/design-studio/': 'drawings',
      '/procurement/purchase-orders/': 'purchase_orders',
      '/procurement/delivery-challans/': 'delivery_challans',
      '/procurement/estimates/': 'material_estimates',
    };
    let projectIds: string[] = projectId ? [projectId] : [];
    for (const [prefix, table] of Object.entries(routeOwners)) {
      if (!path.startsWith(prefix)) continue;
      const id = path.slice(prefix.length).split('/')[0];
      if (/^[0-9a-f-]{36}$/i.test(id)) {
        projectIds = await this.scopes.fromRecord(table, id);
        break;
      }
    }
    for (const id of projectIds.length ? projectIds : [undefined]) {
      if (!(await this.access.check(req.user, `route:${path}`, 'view', id)))
        return { allowed: false };
    }
    return { allowed: true };
  }

  @Get('rules')
  async list(@Req() req: any) {
    await this.access.require(req.user, 'access', 'manage');
    return AccessRuleModel.findAll({ order: [['created_at', 'DESC']] });
  }

  @Post('rules')
  async create(@Req() req: any, @Body() dto: AccessRuleDto) {
    await this.access.require(req.user, 'access', 'manage');
    const subject =
      dto.subject_type === 'USER'
        ? await User.findByPk(dto.subject_id, { include: [Role] })
        : await Role.findByPk(dto.subject_id);
    if (!subject) throw new BadRequestException('Unknown access subject');
    const role =
      dto.subject_type === 'USER' ? (subject as User).role : (subject as Role);
    if (
      !isSuperadmin(req.user) &&
      (role?.name.toUpperCase() === 'SUPERADMIN' ||
        dto.subject_id === req.user.id ||
        dto.subject_id === req.user.roleId ||
        dto.effect === 'ALLOW')
    ) {
      throw new BadRequestException(
        'Only Superadmin may grant overrides or change privileged/self access',
      );
    }
    return AccessRuleModel.create({ ...dto, created_by: req.user.id });
  }

  @Delete('rules/:id')
  async remove(@Req() req: any, @Param('id') id: string) {
    // Removing a denial can elevate access, so only Superadmin may remove rules.
    if (!isSuperadmin(req.user))
      throw new BadRequestException('Only Superadmin may remove access rules');
    await AccessRuleModel.destroy({ where: { id } });
    return { success: true };
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Project } from '../projects/models/projects.model';
import { BudgetGuide } from './models/budget-guide.model';
import {
  CreateBudgetGuideDto,
  ListBudgetGuidesDto,
  TransferBudgetGuideDto,
  UpdateBudgetGuideDto,
} from './dto/budget-guide.dto';
import { calculateGuide } from './budget-guide-calculation';
import { budgetGuideTemplate } from './budget-guide-template';

export type GuideActor = { id: string; permissions?: string[] };
@Injectable()
export class BudgetGuideService {
  constructor(
    @InjectModel(BudgetGuide) private readonly guides: typeof BudgetGuide,
    @InjectModel(Project) private readonly projects: typeof Project,
    private readonly sequelize: Sequelize,
  ) {}

  template(reference = false) {
    return budgetGuideTemplate(reference);
  }
  private validated(data: any): CreateBudgetGuideDto {
    const dto = plainToInstance(CreateBudgetGuideDto, {
      ...data,
      built_up_area:
        data.built_up_area == null ? null : Number(data.built_up_area),
    });
    if (validateSync(dto, { whitelist: true }).length)
      throw new BadRequestException(
        'Invalid budget guide fields or incomplete plans.',
      );
    calculateGuide(dto);
    return dto;
  }
  private async checkProject(
    projectId: string | null | undefined,
    actor: GuideActor,
    transaction?: Transaction,
  ) {
    if (!projectId) return;
    if (!actor.permissions?.includes('projects:read'))
      throw new ForbiddenException('Project linking requires projects:read.');
    if (!(await this.projects.findByPk(projectId, { transaction })))
      throw new NotFoundException('Project not found.');
  }
  private view(row: BudgetGuide) {
    const data = row.toJSON();
    return {
      ...data,
      built_up_area:
        data.built_up_area == null ? null : Number(data.built_up_area),
      calculation: calculateGuide(data as unknown as CreateBudgetGuideDto),
    };
  }
  async create(input: CreateBudgetGuideDto, actor: GuideActor) {
    const dto = this.validated(input);
    await this.checkProject(dto.project_id, actor);
    const row = await this.guides.create({
      ...dto,
      project_id: dto.project_id || null,
      revision: 1,
      created_by: actor.id,
      updated_by: actor.id,
    });
    return this.view(row);
  }
  async list(query: ListBudgetGuidesDto) {
    const where: any = {};
    if (query.project_id) where.project_id = query.project_id;
    if (query.generic) {
      if (query.project_id)
        throw new BadRequestException(
          'Choose either standalone or a project filter.',
        );
      where.project_id = null;
    }
    if (query.status) where.status = query.status;
    if (query.search?.trim())
      where.title = {
        [Op.like]: `%${query.search.trim().replace(/[\\%_]/g, '\\$&')}%`,
      };
    const { rows, count } = await this.guides.findAndCountAll({
      where,
      order: [
        ['updated_at', 'DESC'],
        ['id', 'ASC'],
      ],
      attributes: [
        'id',
        'title',
        'project_id',
        'project_type',
        'status',
        'currency',
        'issue_date',
        'revision',
        'updated_at',
      ],
      include: [
        { model: Project, attributes: ['id', 'name'], required: false },
      ],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return { items: rows, total: count, page: query.page, limit: query.limit };
  }
  async findOne(id: string) {
    const row = await this.guides.findByPk(id, {
      include: [
        { model: Project, attributes: ['id', 'name'], required: false },
      ],
    });
    if (!row) throw new NotFoundException('Budget guide not found.');
    return this.view(row);
  }
  private async locked(id: string, revision: number, transaction: Transaction) {
    const row = await this.guides.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!row) throw new NotFoundException('Budget guide not found.');
    if (row.revision !== revision)
      throw new ConflictException(
        'This guide changed. Reload it before saving.',
      );
    return row;
  }
  async update(id: string, input: UpdateBudgetGuideDto, actor: GuideActor) {
    return this.sequelize.transaction(async (transaction) => {
      const row = await this.locked(id, input.expected_revision, transaction);
      const { expected_revision, ...patch } = input;
      const dto = this.validated({ ...row.toJSON(), ...patch });
      if (dto.project_id !== row.project_id)
        await this.checkProject(dto.project_id, actor, transaction);
      await row.update(
        {
          ...dto,
          project_id: dto.project_id || null,
          revision: row.revision + 1,
          updated_by: actor.id,
        },
        { transaction },
      );
      return this.view(row);
    });
  }
  async transfer(id: string, input: TransferBudgetGuideDto, actor: GuideActor) {
    return this.sequelize.transaction(async (transaction) => {
      const source = await this.locked(
        id,
        input.expected_revision,
        transaction,
      );
      await this.checkProject(input.project_id, actor, transaction);
      const dto = this.validated({
        ...source.toJSON(),
        title: input.title || source.title,
        project_id: input.project_id,
        status: 'draft',
      });
      const copy = await this.guides.create(
        {
          ...dto,
          source_guide_id: source.id,
          revision: 1,
          created_by: actor.id,
          updated_by: actor.id,
        },
        { transaction },
      );
      return this.view(copy);
    });
  }
  async remove(id: string, revision: number) {
    return this.sequelize.transaction(async (transaction) => {
      const row = await this.locked(id, revision, transaction);
      await row.destroy({ transaction });
      return { deleted: true };
    });
  }
}

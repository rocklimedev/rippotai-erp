import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, UniqueConstraintError } from 'sequelize';
import { ProjectPhaseModule } from '@/common/enums/project-planner.enum';

import { ProjectPhase } from './models/project-phase.model';
import { CreateProjectPhaseDto } from './dto/create-project-phase.dto';
import { UpdateProjectPhaseDto } from './dto/update-project-phase.dto';

@Injectable()
export class ProjectPhaseService {
  constructor(
    @InjectModel(ProjectPhase)
    private readonly projectPhaseModel: typeof ProjectPhase,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreateProjectPhaseDto) {
    if (dto.phase_number == null && dto.phase_code == null) return this.createNumberedPhase(dto);
    if (dto.phase_number == null || dto.phase_code == null)
      throw new BadRequestException('Provide both the phase number and code, or omit both.');

    return this.projectPhaseModel.create({
      phase_number: dto.phase_number,
      phase_code: dto.phase_code,
      title: dto.title,
      description: dto.description ?? null,
      sort_order: dto.sort_order ?? dto.phase_number,
    } as ProjectPhase);

  }

  private async createNumberedPhase(dto: CreateProjectPhaseDto) {
    const module = ProjectPhaseModule.DOCUMENTS;
    for (let attempt = 0; attempt < 5; attempt++) {
      // Soft-deleted rows still occupy their unique numbers and codes.
      const phases = await this.projectPhaseModel.findAll({
        where: { module },
        attributes: ['phase_number', 'phase_code'],
        paranoid: false,
      });
      let number = phases.reduce((max, phase) => Math.max(max, phase.phase_number), 0) + 1;
      const codes = new Set(phases.map((phase) => phase.phase_code.toUpperCase()));
      while (codes.has(`P${number}`)) number++;

      try {
        return await this.projectPhaseModel.create({
          module,
          phase_number: number,
          phase_code: `P${number}`,
          title: dto.title,
          description: dto.description ?? null,
          sort_order: dto.sort_order ?? number,
        });
      } catch (error) {
        if (!(error instanceof UniqueConstraintError)) throw error;
      }
    }
    throw new ConflictException('Could not allocate a phase number. Try again.');
  }

  // ============================================================
  // FIND ALL / SEARCH
  // GET /projects/phases
  // GET /projects/phases?search=MEP
  // ============================================================

  async findAll(search?: string) {
    const trimmedSearch = search?.trim();

    const where = trimmedSearch
      ? {
          [Op.or]: [
            {
              phase_code: {
                [Op.like]: `%${trimmedSearch}%`,
              },
            },
            {
              title: {
                [Op.like]: `%${trimmedSearch}%`,
              },
            },
            {
              description: {
                [Op.like]: `%${trimmedSearch}%`,
              },
            },
          ],
        }
      : undefined;

    return this.projectPhaseModel.findAll({
      where,
      order: [
        ['sort_order', 'ASC'],
        ['phase_number', 'ASC'],
      ],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string) {
    const phase = await this.projectPhaseModel.findByPk(id);

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    return phase;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateProjectPhaseDto) {
    const phase = await this.projectPhaseModel.findByPk(id);

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    await phase.update({
      ...(dto.phase_number !== undefined && {
        phase_number: dto.phase_number,
      }),

      ...(dto.phase_code !== undefined && {
        phase_code: dto.phase_code,
      }),

      ...(dto.title !== undefined && {
        title: dto.title,
      }),

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.sort_order !== undefined && {
        sort_order: dto.sort_order,
      }),
    });

    return phase;
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    const phase = await this.projectPhaseModel.findByPk(id);

    if (!phase) {
      throw new NotFoundException('Project phase not found');
    }

    await phase.destroy();

    return {
      message: 'Project phase deleted successfully',
    };
  }
}

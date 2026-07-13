import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectType } from './models/project-type.model';
import {
  CreateProjectTypeDto,
  UpdateProjectTypeDto,
} from './dto/project-type.dto';

@Injectable()
export class ProjectTypeService {
  constructor(
    @InjectModel(ProjectType)
    private readonly projectTypeModel: typeof ProjectType,
  ) {}

  private slugify(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(name);
    let slug = base;
    let suffix = 1;

    while (true) {
      const existing = await this.projectTypeModel.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) break;
      suffix += 1;
      slug = `${base}-${suffix}`;
    }

    return slug;
  }

  async create(dto: CreateProjectTypeDto): Promise<ProjectType> {
    const existingByName = await this.projectTypeModel.findOne({
      where: { name: dto.name },
    });
    if (existingByName) {
      throw new ConflictException(`Project type "${dto.name}" already exists`);
    }

    const slug = await this.generateUniqueSlug(dto.name);

    return this.projectTypeModel.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
    } as ProjectType);
  }

  async findAll(): Promise<ProjectType[]> {
    return this.projectTypeModel.findAll({ order: [['name', 'ASC']] });
  }

  async findOne(id: string): Promise<ProjectType> {
    const projectType = await this.projectTypeModel.findByPk(id);
    if (!projectType) {
      throw new NotFoundException(`Project type ${id} not found`);
    }
    return projectType;
  }

  async update(id: string, dto: UpdateProjectTypeDto): Promise<ProjectType> {
    const projectType = await this.findOne(id);

    if (dto.name && dto.name !== projectType.name) {
      const existingByName = await this.projectTypeModel.findOne({
        where: { name: dto.name },
      });
      if (existingByName && existingByName.id !== id) {
        throw new ConflictException(
          `Project type "${dto.name}" already exists`,
        );
      }
      projectType.slug = await this.generateUniqueSlug(dto.name, id);
      projectType.name = dto.name;
    }

    if (dto.description !== undefined) {
      projectType.description = dto.description;
    }

    await projectType.save();
    return projectType;
  }

  async remove(id: string): Promise<void> {
    const projectType = await this.findOne(id);
    await projectType.destroy(); // soft delete — model is `paranoid: true`
  }
}

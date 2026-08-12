import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkPackage } from './models/work-package.model';
import { CreateWorkPackageDto } from './dto/create-work-package.dto';
import { UpdateWorkPackageDto } from './dto/update-work-package.dto';

@Injectable()
export class WorkPackagesService {
  constructor(
    @InjectModel(WorkPackage)
    private readonly workPackageModel: typeof WorkPackage,
  ) {}

  async create(dto: CreateWorkPackageDto): Promise<WorkPackage> {
    return this.workPackageModel.create({ ...dto } as any);
  }

  async findAll(projectId?: string): Promise<WorkPackage[]> {
    return this.workPackageModel.findAll({
      where: projectId ? { projectId } : undefined,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<WorkPackage> {
    const workPackage = await this.workPackageModel.findByPk(id);
    if (!workPackage) {
      throw new NotFoundException(`Work package ${id} not found`);
    }
    return workPackage;
  }

  async update(id: string, dto: UpdateWorkPackageDto): Promise<WorkPackage> {
    const workPackage = await this.findOne(id);
    return workPackage.update({ ...dto });
  }

  async remove(id: string): Promise<void> {
    const workPackage = await this.findOne(id);
    await workPackage.destroy();
  }
}

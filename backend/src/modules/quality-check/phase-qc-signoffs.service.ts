import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PhaseQcSignoff } from './models/phase-qc-signoff.model';
import { CreatePhaseQcSignoffDto } from './dto/create-phase-qc-signoff.dto';
import { UpdatePhaseQcSignoffDto } from './dto/update-phase-qc-signoff.dto';

@Injectable()
export class PhaseQcSignoffsService {
  constructor(
    @InjectModel(PhaseQcSignoff)
    private readonly signoffModel: typeof PhaseQcSignoff,
  ) {}

  async create(dto: CreatePhaseQcSignoffDto): Promise<PhaseQcSignoff> {
    return this.signoffModel.create({
      ...dto,
      checkedAt: dto.checkedAt ? new Date(dto.checkedAt) : null,
    });
  }

  async findAll(projectId?: string): Promise<PhaseQcSignoff[]> {
    return this.signoffModel.findAll({
      where: projectId ? { projectId } : undefined,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string): Promise<PhaseQcSignoff> {
    const signoff = await this.signoffModel.findByPk(id);

    if (!signoff) {
      throw new NotFoundException(`Phase QC signoff ${id} not found`);
    }

    return signoff;
  }

  async update(
    id: string,
    dto: UpdatePhaseQcSignoffDto,
  ): Promise<PhaseQcSignoff> {
    const signoff = await this.findOne(id);

    return signoff.update({
      ...dto,
      checkedAt: dto.checkedAt ? new Date(dto.checkedAt) : null,
    });
  }

  async remove(id: string): Promise<void> {
    const signoff = await this.findOne(id);
    await signoff.destroy();
  }
}

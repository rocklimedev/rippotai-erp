import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { ContractorLineup } from './models/contractor-lineup.model';
import { CreateContractorLineupDto } from './dto/create-contractor-lineup.dto';
import { UpdateContractorLineupDto } from './dto/update-contractor-lineup.dto';
import { UpdateLineupStatusDto } from './dto/update-lineup-status.dto';
import { ContractorLineupStatus } from '@/common/enums/estimate.enums';

@Injectable()
export class ContractorLineupService {
  constructor(
    @InjectModel(ContractorLineup)
    private readonly model: typeof ContractorLineup,
  ) {}

  async create(dto: CreateContractorLineupDto): Promise<ContractorLineup> {
    try {
      return await this.model.create({
        ...dto,
        status: ContractorLineupStatus.ASSIGNED,
      } as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          'This trade team already has a contractor assigned on this project',
        );
      }
      throw err;
    }
  }

  findAll(filters: {
    projectId?: string;
    vendorId?: string;
    status?: ContractorLineupStatus;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.status) where.status = filters.status;
    return this.model.findAll({ where, order: [['created_at', 'DESC']] });
  }

  async findOne(id: string): Promise<ContractorLineup> {
    const record = await this.model.findByPk(id);
    if (!record) {
      throw new NotFoundException(`Contractor lineup entry ${id} not found`);
    }
    return record;
  }

  async update(
    id: string,
    dto: UpdateContractorLineupDto,
  ): Promise<ContractorLineup> {
    const record = await this.findOne(id);
    try {
      await record.update(dto as any);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          'This trade team already has a contractor assigned on this project',
        );
      }
      throw err;
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await record.destroy();
  }

  private async transition(
    id: string,
    from: ContractorLineupStatus[],
    to: ContractorLineupStatus,
    dto: UpdateLineupStatusDto,
    extra: Record<string, unknown> = {},
  ): Promise<ContractorLineup> {
    const record = await this.findOne(id);
    if (!from.includes(record.status)) {
      throw new ConflictException(
        `Cannot move lineup entry from "${record.status}" to "${to}"`,
      );
    }
    await record.update({
      status: to,
      notes: dto.notes ?? record.notes,
      ...extra,
    });
    return this.findOne(id);
  }

  mobilise(id: string, dto: UpdateLineupStatusDto): Promise<ContractorLineup> {
    return this.transition(
      id,
      [ContractorLineupStatus.ASSIGNED],
      ContractorLineupStatus.MOBILISED,
      dto,
      { mobilisedAt: new Date() },
    );
  }

  complete(id: string, dto: UpdateLineupStatusDto): Promise<ContractorLineup> {
    return this.transition(
      id,
      [ContractorLineupStatus.MOBILISED],
      ContractorLineupStatus.COMPLETED,
      dto,
    );
  }

  release(id: string, dto: UpdateLineupStatusDto): Promise<ContractorLineup> {
    return this.transition(
      id,
      [
        ContractorLineupStatus.COMPLETED,
        ContractorLineupStatus.MOBILISED,
        ContractorLineupStatus.ASSIGNED,
      ],
      ContractorLineupStatus.RELEASED,
      dto,
    );
  }
}

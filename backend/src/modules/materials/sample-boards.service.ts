import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import { SampleBoard } from './models/sample-board.model';
import {
  CreateSampleBoardDto,
  UpdateSampleBoardDto,
} from './dto/sample-board.dto';
import { SampleBoardStatus } from './models/sample-board.model';
@Injectable()
export class SampleBoardsService {
  constructor(
    @InjectModel(SampleBoard) private readonly model: typeof SampleBoard,
  ) {}

  findAll(materialRequirementId?: string) {
    return this.model.findAll({
      where: materialRequirementId ? { materialRequirementId } : undefined,
      order: [['createdAt', 'DESC']],
    });
  }

  async findOne(id: string) {
    const record = await this.model.findByPk(id);
    if (!record) throw new NotFoundException(`SampleBoard ${id} not found`);
    return record;
  }

  create(dto: CreateSampleBoardDto) {
    return this.model.create({
      id: randomUUID(),
      materialRequirementId: dto.material_requirement_id ?? null,
      projectId: dto.project_id,
      title: dto.title,
      vendorId: dto.vendor_id ?? null,
      documentId: dto.document_id ?? null,
      status: dto.status ?? SampleBoardStatus.PROPOSED,
      createdBy: dto.created_by ?? null,
    });
  }

  async update(id: string, dto: UpdateSampleBoardDto) {
    const record = await this.findOne(id);
    return record.update(dto);
  }

  async remove(id: string) {
    const record = await this.findOne(id);
    await record.destroy();
    return { deleted: true };
  }
}

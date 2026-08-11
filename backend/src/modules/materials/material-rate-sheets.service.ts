import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'crypto';
import { MaterialRateSheet } from './models/material-rate-sheet.model';
import {
  CreateMaterialRateSheetDto,
  UpdateMaterialRateSheetDto,
} from './dto/material-rate-sheet.dto';

@Injectable()
export class MaterialRateSheetsService {
  constructor(
    @InjectModel(MaterialRateSheet)
    private readonly model: typeof MaterialRateSheet,
  ) {}

  findAll(vendorId?: string, projectId?: string) {
    const where: Record<string, string> = {};
    if (vendorId) where.vendor_id = vendorId;
    if (projectId) where.project_id = projectId;
    return this.model.findAll({ where, order: [['created_at', 'DESC']] });
  }

  async findOne(id: string) {
    const record = await this.model.findByPk(id);
    if (!record)
      throw new NotFoundException(`MaterialRateSheet ${id} not found`);
    return record;
  }

  create(dto: CreateMaterialRateSheetDto) {
    return this.model.create({
      id: randomUUID(),
      vendorId: dto.vendor_id ?? null,
      projectId: dto.project_id ?? null,
      materialName: dto.material_name,
      unitId: dto.unit_id ?? null,
      rate: dto.rate,
      availability: dto.availability ?? null,
      validUntil: dto.valid_until ?? null,
    });
  }

  async update(id: string, dto: UpdateMaterialRateSheetDto) {
    const record = await this.findOne(id);
    return record.update(dto);
  }

  async remove(id: string) {
    const record = await this.findOne(id);
    await record.destroy();
    return { deleted: true };
  }
}

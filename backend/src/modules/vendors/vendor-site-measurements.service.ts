import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VendorSiteMeasurement } from './models/vendor-site-measurement.model';
import { CreateVendorSiteMeasurementDto } from './dto/create-vendor-site-measurement.dto';
import { UpdateVendorSiteMeasurementDto } from './dto/update-vendor-site-measurement.dto';

@Injectable()
export class VendorSiteMeasurementsService {
  constructor(
    @InjectModel(VendorSiteMeasurement)
    private readonly model: typeof VendorSiteMeasurement,
  ) {}

  create(dto: CreateVendorSiteMeasurementDto): Promise<VendorSiteMeasurement> {
    return this.model.create(dto as any);
  }

  findAll(filters: { projectId?: string; vendorId?: string; tradeTeamId?: string }) {
    const where: Record<string, unknown> = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.tradeTeamId) where.tradeTeamId = filters.tradeTeamId;
    return this.model.findAll({ where, order: [['created_at', 'DESC']] });
  }

  async findOne(id: string): Promise<VendorSiteMeasurement> {
    const record = await this.model.findByPk(id);
    if (!record) {
      throw new NotFoundException(`Vendor site measurement ${id} not found`);
    }
    return record;
  }

  async update(id: string, dto: UpdateVendorSiteMeasurementDto): Promise<VendorSiteMeasurement> {
    const record = await this.findOne(id);
    await record.update(dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);
    await record.destroy();
  }
}

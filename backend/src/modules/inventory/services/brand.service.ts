import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuid } from 'uuid';

import { Brand } from '../models/brand.model';
import { InventoryMaster } from '../models/inventory-master.model';

@Injectable()
export class BrandService {
  constructor(
    @InjectModel(Brand)
    private brandModel: typeof Brand,

    @InjectModel(InventoryMaster)
    private masterModel: typeof InventoryMaster,
  ) {}

  async findAllBrands() {
    return this.brandModel.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']],
    });
  }

  async createBrand(name: string) {
    const trimmedName = name.trim();

    const existing = await this.brandModel.findOne({
      where: { name: trimmedName },
    });

    if (existing) {
      throw new ConflictException('Brand with this name already exists');
    }

    return this.brandModel.create({
      id: uuid(),
      name: trimmedName,
      is_active: true,
    } as any);
  }

  async countTotal() {
    return this.brandModel.count();
  }

  async deleteBrand(id: string) {
    const brand = await this.brandModel.findByPk(id);
    if (!brand) throw new NotFoundException('Brand not found');

    const used = await this.masterModel.count({ where: { brand_id: id } });
    if (used > 0) {
      throw new BadRequestException('Cannot delete brand: It is in use');
    }

    await brand.destroy();
    return { message: 'Brand deleted successfully' };
  }
}

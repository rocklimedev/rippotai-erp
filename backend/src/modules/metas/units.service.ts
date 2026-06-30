import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Unit } from './models/unit.model';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    @InjectModel(Unit)
    private unitModel: typeof Unit,
  ) {}

  async create(dto: CreateUnitDto) {
    return this.unitModel.create(dto as any);
  }

  async findAll() {
    return this.unitModel.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string) {
    const unit = await this.unitModel.findByPk(id);
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(id: string, dto: UpdateUnitDto) {
    const unit = await this.findOne(id);
    return unit.update(dto);
  }

  async remove(id: string) {
    const unit = await this.findOne(id);
    await unit.destroy();
    return { message: 'Unit deleted successfully' };
  }
}

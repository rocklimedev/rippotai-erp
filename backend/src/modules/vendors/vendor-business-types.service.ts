import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VendorBusinessType } from './models/vendor-business-type.model';
import { VendorCategory } from './models/vendor-category.model';

@Injectable()
export class VendorBusinessTypesService {
  constructor(
    @InjectModel(VendorBusinessType)
    private readonly businessTypeModel: typeof VendorBusinessType,
  ) {}

  findAll(category_id?: string) {
    const where = category_id ? { category_id } : {};

    return this.businessTypeModel.findAll({
      where,
      include: [
        {
          model: VendorCategory,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    const businessType = await this.businessTypeModel.findByPk(id, {
      include: [VendorCategory],
    });

    if (!businessType) {
      throw new NotFoundException('Business type not found');
    }

    return businessType;
  }
}

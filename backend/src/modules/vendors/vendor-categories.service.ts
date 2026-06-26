import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';

@Injectable()
export class VendorCategoriesService {
  constructor(
    @InjectModel(VendorCategory)
    private readonly categoryModel: typeof VendorCategory,
  ) {}

  findAll() {
    return this.categoryModel.findAll({
      include: [VendorBusinessType],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    const category = await this.categoryModel.findByPk(id, {
      include: [VendorBusinessType],
    });

    if (!category) {
      throw new NotFoundException('Vendor category not found');
    }

    return category;
  }
}

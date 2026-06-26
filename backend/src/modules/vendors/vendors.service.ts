import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './models/vendors.model';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';
import { Quotation } from '../quotations/models/quotations.model';
@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
  ) {}

  create(dto: CreateVendorDto): Promise<Vendor> {
    return this.vendorModel.create({ ...dto } as any);
  }

  findAll(
    filters: {
      status?: VendorStatus;
      vendor_category_id?: string;
      business_type_id?: string;
    } = {},
  ): Promise<Vendor[]> {
    const where: Record<string, any> = {};

    if (filters.status) where.status = filters.status;
    if (filters.vendor_category_id)
      where.vendor_category_id = filters.vendor_category_id;
    if (filters.business_type_id)
      where.business_type_id = filters.business_type_id;

    return this.vendorModel.findAll({
      where,
      include: [
        { model: VendorCategory, as: 'vendorCategory' },
        { model: VendorBusinessType, as: 'businessType' },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorModel.findByPk(id, {
      include: [
        { model: VendorCategory, as: 'vendorCategory' },
        { model: VendorBusinessType, as: 'businessType' },
      ],
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor ${id} not found`);
    }

    return vendor;
  }

  // ==================== NEW: Get Quotations by Vendor ====================
  async getQuotationsByVendor(vendorId: string) {
    // First verify vendor exists
    await this.findOne(vendorId);

    const quotations = await Quotation.findAll({
      where: { vendorId },
      order: [
        ['quotation_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
      include: [
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'name', 'company_name'],
        },
        // You can include Project if needed
        // {
        //   model: Project,
        //   as: 'project',
        //   attributes: ['id', 'name', 'site_location'],
        // },
      ],
    });

    return quotations;
  }

  async update(id: string, dto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    await vendor.update({ ...dto });
    return this.findOne(id);
  }

  async setStatus(id: string, status: VendorStatus): Promise<Vendor> {
    const vendor = await this.findOne(id);
    await vendor.update({ status });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findOne(id);
    await vendor.destroy();
  }
}

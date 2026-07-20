import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './models/vendors.model';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';
import { Quotation } from '../quotations/models/quotations.model';
import { ActivityLogForVendorService } from '../engagement/services/activity-log-vendors.service';
import { NotificationVendorService } from '../engagement/services/notification-vendor.service';
@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    private readonly activityLogForVendorService: ActivityLogForVendorService,
    private readonly notificationVendorService: NotificationVendorService,
  ) {}

  async create(
    dto: CreateVendorDto,
    user?: any,
    recipientUserIds: string[] = [],
  ): Promise<Vendor> {
    const vendor = await this.vendorModel.create({ ...dto } as any);

    await this.activityLogForVendorService.logVendorCreated(vendor, user);
    await this.notificationVendorService.notifyVendorCreated(vendor, {
      recipientUserIds,
      actorUserId: user?.id,
    });

    return vendor;
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

  async getQuotationsByVendor(vendorId: string) {
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
      ],
    });

    return quotations;
  }

  async update(
    id: string,
    dto: UpdateVendorDto,
    user?: any,
    recipientUserIds: string[] = [],
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    await vendor.update({ ...dto });
    const updated = await this.findOne(id);

    await this.activityLogForVendorService.logVendorUpdated(updated, user, dto);
    await this.notificationVendorService.notifyVendorUpdated(updated, {
      recipientUserIds,
      actorUserId: user?.id,
    });

    return updated;
  }

  async setStatus(
    id: string,
    status: VendorStatus,
    user?: any,
    recipientUserIds: string[] = [],
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    await vendor.update({ status });
    const updated = await this.findOne(id);

    await this.activityLogForVendorService.logVendorUpdated(updated, user, {
      status,
    });
    await this.notificationVendorService.notifyVendorStatusChanged(
      updated,
      status,
      { recipientUserIds, actorUserId: user?.id },
    );

    return updated;
  }

  async remove(
    id: string,
    user?: any,
    recipientUserIds: string[] = [],
  ): Promise<void> {
    const vendor = await this.findOne(id);
    const vendorName = vendor.name ?? vendor.company_name;
    await vendor.destroy();

    await this.activityLogForVendorService.logVendorDeleted(id, user);
    await this.notificationVendorService.notifyVendorDeleted(id, vendorName, {
      recipientUserIds,
      actorUserId: user?.id,
    });
  }
}

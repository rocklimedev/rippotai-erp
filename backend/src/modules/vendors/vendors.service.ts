import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Vendor } from './models/vendors.model';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';
import { Quotation } from '../quotations/models/quotations.model';

import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { VendorStatus } from '@/common/enums';

import { ActivityLogForVendorService } from '../engagement/services/activity-log-vendors.service';
import { NotificationForVendorService } from '../engagement/services/notification-vendor.service';

@Injectable()
export class VendorsService {
  constructor(
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,

    private readonly activityLogForVendorService: ActivityLogForVendorService,
    private readonly notificationForVendorService: NotificationForVendorService,
  ) {}

  // =========================
  // CREATE
  // =========================
  async create(dto: CreateVendorDto, user?: any): Promise<Vendor> {
    const vendor = await this.vendorModel.create({ ...dto } as any);

    const createdVendor = await this.findOne(vendor.id);

    // === Activity Log & Notification ===
    await this.activityLogForVendorService.logVendorCreated(
      createdVendor,
      user,
    );
    await this.notificationForVendorService.notifyVendorCreated(
      createdVendor,
      user?.id,
    );

    return createdVendor;
  }

  // =========================
  // FIND ALL
  // =========================
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

  // =========================
  // FIND ONE
  // =========================
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

  // =========================
  // GET QUOTATIONS BY VENDOR
  // =========================
  async getQuotationsByVendor(vendorId: string) {
    await this.findOne(vendorId); // Verify vendor exists

    return Quotation.findAll({
      where: { vendorId },
      order: [
        ['quotationDate', 'DESC'],
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
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, dto: UpdateVendorDto, user?: any): Promise<Vendor> {
    const vendor = await this.findOne(id);
    const oldStatus = vendor.status;

    await vendor.update({ ...dto });
    const updated = await this.findOne(id);

    // === Activity Log & Notification ===
    await this.activityLogForVendorService.logVendorUpdated(updated, user, dto);
    await this.notificationForVendorService.notifyVendorUpdated(
      updated,
      user?.id,
    );

    // Status Change Notification
    if (oldStatus !== updated.status) {
      await this.notificationForVendorService.notifyVendorStatusChanged(
        updated,
        oldStatus,
        updated.status,
        user?.id,
      );
    }

    return updated;
  }

  // =========================
  // SET STATUS
  // =========================
  async setStatus(
    id: string,
    status: VendorStatus,
    user?: any,
  ): Promise<Vendor> {
    const vendor = await this.findOne(id);
    const oldStatus = vendor.status;

    await vendor.update({ status });
    const updated = await this.findOne(id);

    // === Activity Log & Notification ===
    await this.activityLogForVendorService.logVendorUpdated(updated, user, {
      status,
    });
    await this.notificationForVendorService.notifyVendorStatusChanged(
      updated,
      oldStatus,
      status,
      user?.id,
    );

    return updated;
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string, user?: any): Promise<void> {
    const vendor = await this.findOne(id);
    const vendorName = vendor.name || vendor.company_name || 'Unknown';

    await vendor.destroy();

    // === Activity Log & Notification ===
    await this.activityLogForVendorService.logVendorDeleted(id, user);
    await this.notificationForVendorService.notifyVendorDeleted(
      vendorName,
      user?.id,
    );
  }
}

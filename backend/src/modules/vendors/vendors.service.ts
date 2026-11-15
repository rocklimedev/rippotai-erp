import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { Vendor } from './models/vendors.model';
import { VendorCategory } from './models/vendor-category.model';
import { VendorBusinessType } from './models/vendor-business-type.model';

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

  // =========================
  // EXPORT (CSV)
  // =========================
  /** Vendor directory as CSV: human headers, fixed order, UTF-8 BOM (₹/Ō safe in Excel), raw values. */
  async exportCsv(
    filters: {
      status?: VendorStatus;
      vendor_category_id?: string;
      business_type_id?: string;
    } = {},
  ): Promise<string> {
    const vendors = await this.findAll(filters);
    const taxId = (notes: string | null, re: RegExp) =>
      (String(notes || '').match(re) || [])[1]?.toUpperCase() || '';
    const headers = [
      'Vendor Name',
      'Company',
      'Position',
      'Category',
      'Business Type',
      'Phone',
      'Alternate Phone',
      'Address',
      'GSTIN',
      'PAN',
      'Status',
      'Notes',
      'Added On',
    ];
    const rows = vendors.map((v) => [
      v.name,
      v.company_name,
      v.position,
      v.vendorCategory?.name,
      v.businessType?.name,
      v.contact_number,
      v.alternate_contact,
      v.address,
      taxId(v.notes, /GSTIN\s*[:-]\s*([0-9A-Z]{15})/i),
      taxId(v.notes, /PAN\s*[:-]\s*([A-Z]{5}[0-9]{4}[A-Z])/i),
      v.status
        ? String(v.status).charAt(0).toUpperCase() +
          String(v.status).slice(1).toLowerCase().replace(/_/g, ' ')
        : '',
      v.notes,
      v.created_at ? new Date(v.created_at).toISOString().slice(0, 10) : '',
    ]);
    const cell = (value: string | number | null | undefined) => {
      let text = value === null || value === undefined ? '' : String(value);
      // Neutralise spreadsheet formulas in free text.
      if (/^[=+\-@\t\r]/.test(text) && !/^[+-]?\d/.test(text))
        text = `'${text}`;
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    return (
      '\uFEFF' +
      [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') +
      '\r\n'
    );
  }
}

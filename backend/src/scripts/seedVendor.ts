import { Sequelize } from 'sequelize-typescript';
import vendorData from './data/output.json';

import { Vendor } from '@/modules/vendors/models/vendors.model';
import { VendorCategory } from '@/modules/vendors/models/vendor-category.model';
import { VendorBusinessType } from '@/modules/vendors/models/vendor-business-type.model';
import { VendorStatus } from '@/common/enums';

import * as dotenv from 'dotenv';
import { User } from '@/modules/users/models/user.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Role } from '@/modules/rbac/models/role.model';
import { QuotationVersion } from '@/modules/quotations/models/quotation-versions.model';
import { QuotationItem } from '@/modules/quotations/models/quotation-items.model';
import { Project } from '@/modules/projects/models/projects.model';
import { ActivityLog } from '@/modules/engagement/models/activity-log.model';
import { AuthToken } from '@/modules/auth/models/auth-token.model';
import { RolePermission } from '@/modules/rbac/models/role_permission.model';
import { VerificationToken } from '@/modules/auth/models/verification-token.model';
import { Unit } from '@/modules/metas/models/unit.model';
import { Permission } from '@/modules/rbac/models/permission.model';
import { Notification } from '@/modules/engagement/models/notification.model';
dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'spsyn8lm_rippotai_erp',

  logging: false,

  models: [
    Vendor,
    VendorCategory,
    VendorBusinessType,
    User,
    Quotation,
    Role,
    QuotationVersion,
    QuotationItem,
    Project,
    ActivityLog,
    AuthToken,
    RolePermission,
    VerificationToken,
    Unit,
    Permission,
    Notification,
  ],
});

async function seedVendors() {
  try {
    await sequelize.authenticate();

    console.log('Connected to database.');

    // -----------------------------
    // Categories
    // -----------------------------
    const categories = await VendorCategory.findAll({ raw: true });

    const categoryMap = new Map<string, string>();

    categories.forEach((category: any) => {
      categoryMap.set(category.name.trim().toLowerCase(), category.id);
    });

    // -----------------------------
    // Existing Business Types
    // -----------------------------
    const existingBusinessTypes = await VendorBusinessType.findAll({
      raw: true,
    });

    const existingBusinessTypeMap = new Map<
      string,
      { id: string; category_id: string }
    >();

    existingBusinessTypes.forEach((bt: any) => {
      existingBusinessTypeMap.set(bt.name.trim().toLowerCase(), {
        id: bt.id,
        category_id: bt.category_id,
      });
    });

    // -----------------------------
    // Create Missing Business Types
    // -----------------------------
    const newBusinessTypes: any[] = [];

    for (const item of vendorData) {
      const businessType = String(item.business_types ?? '')
        .trim()
        .toLowerCase();

      if (!businessType) continue;

      if (!existingBusinessTypeMap.has(businessType)) {
        const categoryId = categoryMap.get(
          String(item['vendor-category']).trim().toLowerCase(),
        );

        if (!categoryId) {
          console.warn(
            `Category not found for business type "${item.business_types}"`,
          );
          continue;
        }

        newBusinessTypes.push({
          category_id: categoryId,
          name: String(item.business_types).trim(),
          status: true,
        });

        // Prevent duplicates in the same JSON
        existingBusinessTypeMap.set(businessType, {
          id: '',
          category_id: categoryId,
        });
      }
    }

    if (newBusinessTypes.length) {
      await VendorBusinessType.bulkCreate(newBusinessTypes as any);

      console.log(`Inserted ${newBusinessTypes.length} new business types.`);
    }

    // -----------------------------
    // Reload Business Types
    // -----------------------------
    const businessTypes = await VendorBusinessType.findAll({
      raw: true,
    });

    const businessTypeMap = new Map<
      string,
      { id: string; category_id: string }
    >();

    businessTypes.forEach((bt: any) => {
      businessTypeMap.set(bt.name.trim().toLowerCase(), {
        id: bt.id,
        category_id: bt.category_id,
      });
    });

    // -----------------------------
    // Vendors
    // -----------------------------
    const vendors = vendorData.map((item) => {
      const business = businessTypeMap.get(
        String(item.business_types ?? '')
          .trim()
          .toLowerCase(),
      );

      const categoryId =
        business?.category_id ??
        categoryMap.get(
          String(item['vendor-category'] ?? '')
            .trim()
            .toLowerCase(),
        ) ??
        null;

      return {
        name: String(item.name ?? '').trim(),

        vendor_category_id: categoryId,

        business_type_id: business?.id ?? null,

        contact_number: String(item.contact_number ?? '')
          .replace(/\s+/g, '')
          .trim(),

        address: item.address ? String(item.address).trim() : null,

        status: VendorStatus.ACTIVE,
      };
    });

    await Vendor.bulkCreate(vendors as any);

    console.log(`Inserted ${vendors.length} vendors.`);
    console.log('Vendor seeding completed.');
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

seedVendors();

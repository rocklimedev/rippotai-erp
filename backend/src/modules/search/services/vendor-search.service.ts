import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { Vendor } from '../../vendors/models/vendors.model';
import { VendorCategory } from '../../vendors/models/vendor-category.model';
import { VendorBusinessType } from '../../vendors/models/vendor-business-type.model';
import { User } from '@/modules/users/models/user.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';

@Injectable()
export class VendorSearchService {
  private readonly logger = new Logger(VendorSearchService.name);

  private readonly INDEX = 'vendors';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
  ) {}

  /**
   * Convert Vendor model into Elasticsearch document
   */
  private toDocument(vendor: Vendor) {
    return {
      id: vendor.id,

      name: vendor.name,
      company_name: vendor.company_name,
      position: vendor.position,

      contact_number: vendor.contact_number,
      alternate_contact: vendor.alternate_contact,

      address: vendor.address,
      notes: vendor.notes,

      status: vendor.status,

      category: vendor.vendorCategory?.name ?? '',
      business_type: vendor.businessType?.name ?? '',

      quotations_count: vendor.quotations?.length ?? 0,

      created_by: vendor.creator?.name ?? '',
      updated_by: vendor.updater?.name ?? '',

      created_at: vendor.created_at,
      updated_at: vendor.updated_at,
    };
  }

  /**
   * Index a vendor
   */
  async indexVendor(id: string) {
    const vendor = await this.vendorModel.findByPk(id, {
      include: [
        {
          model: VendorCategory,
          as: 'vendorCategory',
        },
        {
          model: VendorBusinessType,
          as: 'businessType',
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: User,
          as: 'updater',
        },
        {
          model: Quotation,
        },
      ],
    });

    if (!vendor) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      vendor.id,
      this.toDocument(vendor),
    );

    this.logger.log(`Indexed Vendor ${vendor.id}`);
  }

  /**
   * Update vendor index
   */
  async updateVendor(id: string) {
    return this.indexVendor(id);
  }

  /**
   * Remove vendor from Elasticsearch
   */
  async removeVendor(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed Vendor ${id}`);
  }

  /**
   * Search vendors
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'name^6',
          'company_name^5',
          'contact_number^5',
          'alternate_contact^4',
          'category^4',
          'business_type^4',
          'position^3',
          'address^2',
          'notes^2',
          'status',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all vendors
   */
  async reindexAll() {
    const vendors = await this.vendorModel.findAll({
      include: [
        {
          model: VendorCategory,
          as: 'vendorCategory',
        },
        {
          model: VendorBusinessType,
          as: 'businessType',
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: User,
          as: 'updater',
        },
        {
          model: Quotation,
        },
      ],
    });

    for (const vendor of vendors) {
      await this.searchService.index(
        this.INDEX,
        vendor.id,
        this.toDocument(vendor),
      );
    }

    this.logger.log(`Indexed ${vendors.length} vendors`);
  }
}

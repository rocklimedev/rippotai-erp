import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SearchService } from '../search.service';
import { BulkIndexerService } from '../indexing/bulk-indexer.service';
import { SearchableDocument } from '../interfaces/searchable-document.interface';
import { Vendor } from '@/modules/vendors/models/vendors.model';

@Injectable()
export class VendorSearchService {
  private readonly logger = new Logger(VendorSearchService.name);
  private readonly INDEX = 'vendors';

  constructor(
    private readonly searchService: SearchService,
    private readonly bulkIndexer: BulkIndexerService,
    @InjectModel(Vendor) private readonly vendorModel: typeof Vendor,
  ) {}

  private toDocument(vendor: any): SearchableDocument {
    const category = vendor.vendorCategory?.name ?? vendor.category?.name ?? '';
    const businessType =
      vendor.businessType?.name ?? vendor.business_type?.name ?? '';
    const title = vendor.name ?? vendor.company_name ?? 'Untitled Vendor';
    const subtitle = [vendor.company_name, category, vendor.status]
      .filter(Boolean)
      .join(' · ');

    return {
      entity_type: 'vendor',
      id: vendor.id,
      title,
      subtitle,
      status: vendor.status ?? null,
      searchable_text: [
        vendor.name,
        vendor.company_name,
        vendor.position,
        vendor.contact_number,
        vendor.alternate_contact,
        vendor.address,
        vendor.notes,
        category,
        businessType,
        vendor.status,
      ]
        .filter(Boolean)
        .join(' '),
      created_at: vendor.created_at ?? vendor.createdAt,
      updated_at: vendor.updated_at ?? vendor.updatedAt,
      visibility: 'internal',
      is_deleted: false,

      company_name: vendor.company_name,
      contact_number: vendor.contact_number,
      alternate_contact: vendor.alternate_contact,
      address: vendor.address,
      notes: vendor.notes,
      category,
      business_type: businessType,
    };
  }

  async indexOne(id: string): Promise<void> {
    const vendor = await this.vendorModel.findByPk(id, {
      include: [
        { association: 'vendorCategory', required: false },
        { association: 'businessType', required: false },
      ],
    });
    if (!vendor) {
      await this.searchService.deleteDocument(this.INDEX, id);
      return;
    }
    await this.searchService.indexDocument(
      this.INDEX,
      vendor.id,
      this.toDocument(vendor),
    );
  }

  async removeOne(id: string): Promise<void> {
    await this.searchService.deleteDocument(this.INDEX, id);
  }

  async reindexAll() {
    await this.searchService.ensureIndex(this.INDEX);
    const rows = await this.vendorModel.findAll({
      include: [
        { association: 'vendorCategory', required: false },
        { association: 'businessType', required: false },
      ],
    });
    const items = rows.map((v) => ({
      index: this.INDEX,
      id: v.id,
      document: this.toDocument(v),
    }));
    const result = await this.bulkIndexer.indexBatch(items);
    await this.searchService.refresh(this.INDEX);
    this.logger.log(`Reindexed vendors: ${result.indexed}/${result.total}`);
    return result;
  }

  async search(query: string, size = 20) {
    if (!query?.trim()) return [];
    const response = await this.searchService.search(this.INDEX, {
      size,
      query: {
        multi_match: {
          query: query.trim(),
          fields: [
            'title^6',
            'company_name^5',
            'contact_number^4',
            'category^3',
            'business_type^3',
            'address^2',
            'notes^2',
            'searchable_text',
          ],
          fuzziness: 'AUTO',
        },
      },
    });
    return (response.hits?.hits ?? []).map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...(hit._source as object),
    }));
  }
}

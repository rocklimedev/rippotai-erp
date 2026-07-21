import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { SearchService } from '@/modules/search/search.service';

import { Quotation } from '../../quotations/models/quotations.model';
import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';
import { User } from '@/modules/users/models/user.model';
import { QuotationItem } from '../../quotations/models/quotation-items.model';
import { QuotationVersion } from '../../quotations/models/quotation-versions.model';

@Injectable()
export class QuotationSearchService {
  private readonly logger = new Logger(QuotationSearchService.name);

  private readonly INDEX = 'quotations';

  constructor(
    private readonly searchService: SearchService,

    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,
  ) {}

  /**
   * Convert quotation into Elasticsearch document
   */
  private toDocument(quotation: Quotation) {
    return {
      id: quotation.id,

      quotation_number: quotation.quotationNumber,
      quotation_date: quotation.quotationDate,
      expiry_date: quotation.expiryDate,
      validity_days: quotation.validityDays,

      status: quotation.status,

      project_id: quotation.projectId,
      vendor_id: quotation.vendorId,

      project: quotation.project?.name ?? '',
      vendor:
        (quotation.vendorSnapshot as any)?.name ?? quotation.vendor?.name ?? '',

      boq_reference: quotation.boqReference,

      subtotal: quotation.subtotal,
      additional_charges: quotation.additionalCharges,

      global_discount_type: quotation.globalDiscountType,
      global_discount_value: quotation.globalDiscountValue,

      discount: quotation.discount,

      tax_percent: quotation.taxPercent,
      tax_amount: quotation.taxAmount,

      total_amount: quotation.totalAmount,

      comparison_notes: quotation.comparisonNotes,
      review_remarks: quotation.reviewRemarks,
      terms_conditions: quotation.termsConditions,

      is_selected: quotation.isSelected,
      current_version: quotation.currentVersion,

      items_count: quotation.items?.length ?? 0,
      versions_count: quotation.versions?.length ?? 0,

      submitted_by: quotation.submitter?.name ?? '',
      reviewed_by: quotation.reviewer?.name ?? '',
      selected_by: quotation.selector?.name ?? '',
      created_by: quotation.creator?.name ?? '',

      created_at: quotation.createdAt,
      updated_at: quotation.updatedAt,
    };
  }

  /**
   * Index quotation
   */
  async indexQuotation(id: string) {
    const quotation = await this.quotationModel.findByPk(id, {
      include: [
        {
          model: Project,
        },
        {
          model: Vendor,
        },
        {
          model: QuotationItem,
        },
        {
          model: QuotationVersion,
        },
        {
          model: User,
          as: 'submitter',
        },
        {
          model: User,
          as: 'reviewer',
        },
        {
          model: User,
          as: 'selector',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    if (!quotation) {
      return;
    }

    await this.searchService.index(
      this.INDEX,
      quotation.id,
      this.toDocument(quotation),
    );

    this.logger.log(`Indexed quotation ${quotation.id}`);
  }

  /**
   * Update quotation index
   */
  async updateQuotation(id: string) {
    return this.indexQuotation(id);
  }

  /**
   * Remove quotation from index
   */
  async removeQuotation(id: string) {
    await this.searchService.delete(this.INDEX, id);

    this.logger.log(`Removed quotation ${id}`);
  }

  /**
   * Search quotations
   */
  async search(query: string) {
    return this.searchService.search(this.INDEX, {
      multi_match: {
        query,
        fields: [
          'quotation_number^6',
          'project^5',
          'vendor^5',
          'boq_reference^4',
          'comparison_notes^3',
          'review_remarks^3',
          'terms_conditions^2',
          'status^2',
          'submitted_by',
          'reviewed_by',
          'selected_by',
        ],
        fuzziness: 'AUTO',
      },
    });
  }

  /**
   * Reindex all quotations
   */
  async reindexAll() {
    const quotations = await this.quotationModel.findAll({
      include: [
        {
          model: Project,
        },
        {
          model: Vendor,
        },
        {
          model: QuotationItem,
        },
        {
          model: QuotationVersion,
        },
        {
          model: User,
          as: 'submitter',
        },
        {
          model: User,
          as: 'reviewer',
        },
        {
          model: User,
          as: 'selector',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    });

    for (const quotation of quotations) {
      await this.searchService.index(
        this.INDEX,
        quotation.id,
        this.toDocument(quotation),
      );
    }

    this.logger.log(`Indexed ${quotations.length} quotations`);
  }
}

// src/modules/documents/services/documents-dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, fn, col, literal } from 'sequelize';
import { Document } from './models/document.model';
import { Drawing } from './models/drawing.model';

import { SiteRecce } from '@/modules/reki/models/site-recce.model';
import { ProjectBrief } from '@/modules/brief/models/project-brief.model';
import { Quotation } from '@/modules/quotations/models/quotations.model';
import { Boq } from '@/modules/boqs/models/boq.model';

import { Project } from '@/modules/projects/models/projects.model';
import { Vendor } from '@/modules/vendors/models/vendors.model';

@Injectable()
export class DocumentsDashboardService {
  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,

    @InjectModel(Drawing)
    private readonly drawingModel: typeof Drawing,

    @InjectModel(SiteRecce)
    private readonly siteRecceModel: typeof SiteRecce,

    @InjectModel(ProjectBrief)
    private readonly projectBriefModel: typeof ProjectBrief,

    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    @InjectModel(Boq)
    private readonly boqModel: typeof Boq,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,

    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
  ) {}

  // ============================================================
  // RECENT ACTIVITY
  // Documents + Drawings + Briefs + Site Recce
  // ============================================================

  async getRecentDocuments(limit: number = 6) {
    const [documents, drawings, briefs, recce] = await Promise.all([
      // --------------------------------------------------------
      // DOCUMENTS
      // --------------------------------------------------------

      this.documentModel.findAll({
        limit: 4,

        order: [['createdAt', 'DESC']],

        attributes: [
          'id',
          'title',
          'filename',
          'category',
          'uploadedByName',
          'createdAt',
          'docType',
        ],

        include: [
          {
            model: Project,
            attributes: ['name'],
          },
        ],
      }),

      // --------------------------------------------------------
      // DRAWINGS
      // --------------------------------------------------------

      this.drawingModel.findAll({
        limit: 3,

        order: [['createdAt', 'DESC']],

        attributes: [
          'id',
          'title',
          'drawingNumber',
          'revision',
          'status',
          'createdAt',
        ],
      }),

      // --------------------------------------------------------
      // PROJECT BRIEFS
      // --------------------------------------------------------

      this.projectBriefModel.findAll({
        limit: 2,

        order: [['createdAt', 'DESC']],
      }),

      // --------------------------------------------------------
      // SITE RECCE
      // --------------------------------------------------------

      this.siteRecceModel.findAll({
        limit: 2,

        order: [['createdAt', 'DESC']],

        attributes: [
          'id',
          'project_id',
          'project_name',
          'client_name',
          'site_address',
          'recce_date',
          'site_engineer_id',
          'accompanied_by',
          'site_type',
          'createdAt',
        ],

        include: [
          {
            model: Project,
            as: 'project',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
      }),
    ]);

    const combined = [
      ...documents.map((d) => ({
        type: 'document' as const,
        ...d.toJSON(),
      })),

      ...drawings.map((d) => ({
        type: 'drawing' as const,
        ...d.toJSON(),
      })),

      ...briefs.map((b) => ({
        type: 'project_brief' as const,
        ...b.toJSON(),
      })),

      ...recce.map((r) => ({
        type: 'site_recce' as const,
        ...r.toJSON(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return combined.slice(0, limit);
  }

  // ============================================================
  // PENDING ITEMS
  // ============================================================

  async getPendingDocuments() {
    const [docs, drawings, recce] = await Promise.all([
      // --------------------------------------------------------
      // PENDING DOCUMENTS
      // --------------------------------------------------------

      this.documentModel.count({
        where: {
          status: {
            [Op.in]: ['draft', 'pending'],
          },
        },
      }),

      // --------------------------------------------------------
      // DRAFT DRAWINGS
      // --------------------------------------------------------

      this.drawingModel.count({
        where: {
          status: 'Draft',
        },
      }),

      // --------------------------------------------------------
      // SITE RECCE
      // --------------------------------------------------------
      //
      // SiteRecce currently has NO status field.
      //
      // Therefore we do not filter by status here.
      //
      // This counts all active Site Recce records.
      //
      // Because SiteRecce uses paranoid: true, deleted records
      // are automatically excluded by Sequelize.
      // --------------------------------------------------------

      this.siteRecceModel.count(),
    ]);

    return {
      documents: docs,
      drawings,
      siteRecce: recce,

      totalPending: docs + drawings + recce,
    };
  }

  // ============================================================
  // EXPIRING SOON QUOTATIONS
  // Used by QuotProjectWiseExpiring widget
  // ============================================================

  async getExpiringQuotations(withinDays: number = 7) {
    const today = new Date();

    const expiryThreshold = new Date();

    expiryThreshold.setDate(today.getDate() + withinDays);

    const quotations = await this.quotationModel.findAll({
      where: {
        expiryDate: {
          [Op.between]: [today, expiryThreshold],
        },

        status: {
          [Op.notIn]: ['approved', 'declined', 'cancelled'],
        },
      },

      include: [
        {
          model: Project,
          attributes: ['name'],
        },

        {
          model: Vendor,
          attributes: ['name'],
        },
      ],

      attributes: [
        'id',
        'quotationNumber',
        'vendorId',
        'expiryDate',
        'status',
        'totalAmount',
      ],

      order: [['expiryDate', 'ASC']],

      limit: 10,
    });

    // ----------------------------------------------------------
    // ADD COMPUTED DAYS LEFT
    // ----------------------------------------------------------

    return quotations.map((q) => {
      const daysLeft = Math.ceil(
        (new Date(q.expiryDate!).getTime() - today.getTime()) /
          (1000 * 3600 * 24),
      );

      return {
        ...q.toJSON(),

        days_left: daysLeft > 0 ? daysLeft : 0,
      };
    });
  }

  // ============================================================
  // BOQ VS ESTIMATE / QUOTATION VARIANCE
  // ============================================================

  async getBoqVariance() {
    const result = await this.boqModel.findAll({
      attributes: [
        [
          fn(
            'AVG',
            literal(`
                (
                  SELECT AVG(
                    (
                      (q.total_amount - b.total_value)
                      / NULLIF(b.total_value, 0)
                    ) * 100
                  )
                  FROM quotations q
                  WHERE q.project_id = "Boq"."project_id"
                  AND q.status IN ('approved', 'submitted')
                )
              `),
          ),

          'avg_variation_pct',
        ],
      ],

      include: [
        {
          model: this.quotationModel,
          attributes: [],
          required: false,
        },
      ],

      group: ['Boq.project_id'],

      raw: true,
    });

    const avg = result[0]?.avg_variation_pct
      ? parseFloat(result[0].avg_variation_pct as string)
      : null;

    return {
      avg_variation_pct: avg !== null ? Math.round(avg * 10) / 10 : null,
    };
  }

  // ============================================================
  // DRAFT ESTIMATES / QUOTATIONS
  // ============================================================

  async getDraftEstimates() {
    const [drafts, awaitingReview] = await Promise.all([
      // ------------------------------------------------------
      // DRAFT
      // ------------------------------------------------------

      this.quotationModel.count({
        where: {
          status: 'draft',
        },
      }),

      // ------------------------------------------------------
      // SUBMITTED / AWAITING REVIEW
      // ------------------------------------------------------

      this.quotationModel.count({
        where: {
          status: 'submitted',
        },
      }),
    ]);

    return {
      drafts,

      awaiting_review: awaitingReview,
    };
  }

  // ============================================================
  // OVERALL DASHBOARD STATS
  // ============================================================

  async getDashboardStats() {
    const [
      totalDocs,
      totalDrawings,
      totalRecce,
      totalBriefs,
      totalQuotations,
      pendingQuotations,
    ] = await Promise.all([
      // --------------------------------------------------------
      // DOCUMENTS
      // --------------------------------------------------------

      this.documentModel.count(),

      // --------------------------------------------------------
      // DRAWINGS
      // --------------------------------------------------------

      this.drawingModel.count(),

      // --------------------------------------------------------
      // SITE RECCE
      // --------------------------------------------------------

      this.siteRecceModel.count(),

      // --------------------------------------------------------
      // PROJECT BRIEFS
      // --------------------------------------------------------

      this.projectBriefModel.count(),

      // --------------------------------------------------------
      // QUOTATIONS
      // --------------------------------------------------------

      this.quotationModel.count(),

      // --------------------------------------------------------
      // PENDING QUOTATIONS
      // --------------------------------------------------------

      this.quotationModel.count({
        where: {
          status: 'draft',
        },
      }),
    ]);

    return {
      totalDocuments: totalDocs,

      totalDrawings,

      totalSiteRecce: totalRecce,

      totalProjectBriefs: totalBriefs,

      totalQuotations,

      overallTotal:
        totalDocs + totalDrawings + totalRecce + totalBriefs + totalQuotations,

      pendingQuotations,
    };
  }

  // ============================================================
  // PROJECT-WISE SUMMARY
  // ============================================================

  async getProjectWiseDocuments(limit: number = 5) {
    return this.projectModel.findAll({
      attributes: [
        'id',
        'name',

        [fn('COUNT', col('documents.id')), 'document_count'],

        [fn('COUNT', col('drawings.id')), 'drawing_count'],

        [fn('COUNT', col('quotations.id')), 'quotation_count'],
      ],

      include: [
        {
          model: Document,
          attributes: [],
          required: false,
        },

        {
          model: Drawing,
          attributes: [],
          required: false,
        },

        {
          model: Quotation,
          attributes: [],
          required: false,
        },
      ],

      group: ['Project.id', 'Project.name'],

      order: [[literal('quotation_count'), 'DESC']],

      limit,
    });
  }
}

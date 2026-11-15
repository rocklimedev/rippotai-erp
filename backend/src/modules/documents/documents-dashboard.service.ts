// src/modules/documents/services/documents-dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Document } from './models/document.model';
import { Drawing } from './models/drawing.model';

import { SiteRecce } from '@/modules/reki/models/site-recce.model';
import { ProjectBrief } from '@/modules/brief/models/project-brief.model';
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

        order: [['created_at', 'DESC']],

        attributes: [
          'id',
          'title',
          'drawingNumber',
          'status',
          ['created_at', 'createdAt'],
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

        order: [['created_at', 'DESC']],

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
          ['created_at', 'createdAt'],
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
  // OVERALL DASHBOARD STATS
  // ============================================================

  async getDashboardStats() {
    const [totalDocs, totalDrawings, totalRecce, totalBriefs] =
      await Promise.all([
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
      ]);

    return {
      totalDocuments: totalDocs,

      totalDrawings,

      totalSiteRecce: totalRecce,

      totalProjectBriefs: totalBriefs,

      overallTotal: totalDocs + totalDrawings + totalRecce + totalBriefs,
    };
  }

  // ============================================================
  // PROJECT-WISE SUMMARY
  // ============================================================

  async getProjectWiseDocuments(limit: number = 5) {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    const [rows] = await this.projectModel.sequelize!.query(
      `
      SELECT p.id, p.name,
        (SELECT COUNT(*) FROM documents d WHERE d.project_id = p.id) AS document_count,
        (SELECT COUNT(*) FROM drawings dr WHERE dr.project_id = p.id) AS drawing_count
      FROM projects p
      WHERE p.deleted_at IS NULL
      ORDER BY document_count DESC, drawing_count DESC
      LIMIT :limit`,
      { replacements: { limit: safeLimit } },
    );
    return (rows as Array<Record<string, unknown>>).map((r) => ({
      ...r,
      document_count: Number(r.document_count),
      drawing_count: Number(r.drawing_count),
    }));
  }
}

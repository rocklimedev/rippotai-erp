import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

import { SiteRecce } from './models/site-recce.model';
import { SiteRecceFloor } from './models/site-recce-floor.model';
import { SiteRecceRoom } from './models/site-recce-room.model';
import { SiteLayoutAttachment } from './models/site-layout-attachment.model';
import { SiteImageAttachment } from './models/site-image-attachment.model';
import { SiteRecceDocument } from './models/site-recce-document.model';
import { Project } from '../projects/models/projects.model';
import { Document } from '../documents/models/document.model';

import { DocumentsService } from '../documents/document.service';
import { ActivityLogForSiteRecceService } from '../engagement/services/activity-log-site-recce.service';
import { NotificationForSiteRecceService } from '../engagement/services/notification-site-recce.service';

@Injectable()
export class SiteRecceService {
  constructor(
    @InjectModel(SiteRecce)
    private readonly siteRecceModel: typeof SiteRecce,
    @InjectModel(SiteRecceFloor)
    private readonly floorModel: typeof SiteRecceFloor,
    @InjectModel(SiteRecceRoom)
    private readonly roomModel: typeof SiteRecceRoom,
    @InjectModel(SiteLayoutAttachment)
    private readonly layoutModel: typeof SiteLayoutAttachment,
    @InjectModel(SiteImageAttachment)
    private readonly imageModel: typeof SiteImageAttachment,
    @InjectModel(SiteRecceDocument)
    private readonly documentModel: typeof SiteRecceDocument,
    @InjectModel(Document)
    private readonly documentModelDirect: typeof Document,

    private readonly sequelize: Sequelize,
    private readonly documentsService: DocumentsService,

    private readonly activityLogForSiteRecceService: ActivityLogForSiteRecceService,
    private readonly notificationForSiteRecceService: NotificationForSiteRecceService,
  ) {}

  // ========================================
  // CREATE FULL RECCE
  // ========================================
  async createFullRecce(
    createData: any,
    createdBy: string,
    files?: { layoutImages?: Express.Multer.File[] },
  ) {
    const transaction = await this.sequelize.transaction();
    try {
      const recce = await this.siteRecceModel.create(
        {
          ...createData,
          created_by: createdBy,
          updated_by: createdBy,
        },
        { transaction },
      );

      // Floors + Rooms
      if (createData.floors && Array.isArray(createData.floors)) {
        for (const floorData of createData.floors) {
          const floor = await this.floorModel.create(
            { ...floorData, site_recce_id: recce.id },
            { transaction },
          );
          if (floorData.rooms && Array.isArray(floorData.rooms)) {
            for (const roomData of floorData.rooms) {
              await this.roomModel.create(
                { ...roomData, floor_id: floor.id },
                { transaction },
              );
            }
          }
        }
      }

      // Layout Attachments + Images
      const layoutImages = files?.layoutImages || [];
      let imageFileIndex = 0;

      if (
        createData.layoutAttachments &&
        Array.isArray(createData.layoutAttachments)
      ) {
        for (const layoutData of createData.layoutAttachments) {
          const imagesMeta = Array.isArray(layoutData.images)
            ? layoutData.images
            : [];
          const createdImageDocs: { documentId: string; meta: any }[] = [];
          let layoutDocumentId: string | undefined;

          for (const imageMeta of imagesMeta) {
            const file = layoutImages[imageFileIndex];
            if (!file) continue;

            const doc = await this.documentsService.create(
              {
                project_id: createData.project_id,
                category: 'Drawings',
                title:
                  imageMeta.caption || layoutData.title || file.originalname,
                visibility: 'internal',
              },
              file,
              undefined,
              transaction,
            );

            if (!layoutDocumentId) layoutDocumentId = doc.id;
            createdImageDocs.push({ documentId: doc.id, meta: imageMeta });
            imageFileIndex++;
          }

          if (!layoutDocumentId) {
            throw new BadRequestException(
              `Layout "${layoutData.title || ''}" requires at least one image`,
            );
          }

          const layout = await this.layoutModel.create(
            {
              title: layoutData.title,
              remark: layoutData.remark,
              floor_id: layoutData.floor_id,
              site_recce_id: recce.id,
              document_id: layoutDocumentId,
              created_by: createdBy,
              sort_order: layoutData.sort_order || 0,
            } as any,
            { transaction },
          );

          for (const { documentId, meta } of createdImageDocs) {
            await this.imageModel.create(
              {
                site_layout_attachment_id: layout.id,
                document_id: documentId,
                caption: meta.caption || '',
                sort_order: meta.sort_order || 0,
                created_by: createdBy,
              } as any,
              { transaction },
            );
          }
        }
      }

      // Additional Documents
      if (createData.documents && Array.isArray(createData.documents)) {
        for (const docData of createData.documents) {
          await this.documentModel.create(
            { ...docData, site_recce_id: recce.id },
            { transaction },
          );
        }
      }

      await transaction.commit();

      const createdRecce = await this.findOneWithRelations(recce.id);

      // === Activity Log & Notification ===
      await this.activityLogForSiteRecceService.logSiteRecceCreated(
        createdRecce,
        { id: createdBy },
      );
      await this.notificationForSiteRecceService.notifySiteRecceCreated(
        createdRecce,
        createdBy,
      );

      return createdRecce;
    } catch (error: unknown) {
      await transaction.rollback();
      console.error('Create Full Recce Error:', error);
      throw new BadRequestException(
        `Failed to create recce: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ========================================
  // FIND ONE WITH ALL RELATIONS
  // ========================================
  async findOneWithRelations(id: string) {
    const recce = await this.siteRecceModel.findByPk(id, {
      include: [
        {
          model: SiteRecceFloor,
          include: [SiteRecceRoom],
        },
        {
          model: SiteLayoutAttachment,
          include: [
            {
              model: SiteImageAttachment,
              include: [{ model: Document }],
            },
            { model: Document },
          ],
        },
        {
          model: SiteRecceDocument,
          include: [
            {
              model: Document,
              as: 'document',
              attributes: [
                'id',
                'title',
                'filename',
                'url',
                'mime',
                'size',
                'category',
                'status',
                'visibility',
                'version',
                'documentDate',
                'docNo',
              ],
            },
          ],
        },
        {
          model: Project,
          attributes: ['id', 'name', 'slug', 'site_location', 'client_id'],
        },
      ],
      order: [
        [{ model: SiteRecceFloor, as: 'floors' }, 'floor_order', 'ASC'],
        [
          { model: SiteLayoutAttachment, as: 'layoutAttachments' },
          'sort_order',
          'ASC',
        ],
      ],
    });

    if (!recce) {
      throw new NotFoundException(`Site Recce with ID ${id} not found`);
    }
    return recce;
  }

  // ========================================
  // FIND ALL
  // ========================================
  async findAll(projectId?: string, status?: string) {
    const where: any = {};
    if (projectId) where.project_id = projectId;
    if (status) where.status = status;

    return this.siteRecceModel.findAll({
      where,
      include: [
        { model: SiteRecceFloor, include: [SiteRecceRoom] },
        { model: SiteLayoutAttachment, include: [SiteImageAttachment] },
        {
          model: SiteRecceDocument,
          include: [{ model: Document, as: 'document' }],
        },
        { model: Project, attributes: ['id', 'name', 'slug'] },
      ],
      order: [
        ['recce_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  // ========================================
  // UPDATE
  // ========================================
  async update(id: string, updateData: any, updatedBy: string) {
    const recce = await this.siteRecceModel.findByPk(id);
    if (!recce) throw new NotFoundException('Recce not found');

    const oldStatus = recce.status;

    await recce.update({ ...updateData, updated_by: updatedBy });

    const updatedRecce = await this.findOneWithRelations(id);

    // === Activity Log & Notification ===
    await this.activityLogForSiteRecceService.logSiteRecceUpdated(
      updatedRecce,
      { id: updatedBy },
    );
    await this.notificationForSiteRecceService.notifySiteRecceUpdated(
      updatedRecce,
      updatedBy,
    );

    if (oldStatus !== updatedRecce.status) {
      await this.activityLogForSiteRecceService.logSiteRecceStatusChanged(
        updatedRecce,
        oldStatus,
        updatedRecce.status,
        { id: updatedBy },
      );
      await this.notificationForSiteRecceService.notifySiteRecceStatusChanged(
        updatedRecce,
        oldStatus,
        updatedRecce.status,
        updatedBy,
      );
    }

    return updatedRecce;
  }

  // ========================================
  // UPDATE STATUS
  // ========================================
  async updateStatus(id: string, status: string, updatedBy: string) {
    const validStatuses = [
      'draft',
      'scheduled',
      'in_progress',
      'completed',
      'approved',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const recce = await this.siteRecceModel.findByPk(id);
    if (!recce) throw new NotFoundException('Recce not found');

    const oldStatus = recce.status;

    await recce.update({ status, updated_by: updatedBy });

    const updatedRecce = await this.findOneWithRelations(id);

    // === Activity Log & Notification ===
    await this.activityLogForSiteRecceService.logSiteRecceStatusChanged(
      updatedRecce,
      oldStatus,
      status,
      { id: updatedBy },
    );
    await this.notificationForSiteRecceService.notifySiteRecceStatusChanged(
      updatedRecce,
      oldStatus,
      status,
      updatedBy,
    );

    return updatedRecce;
  }

  // ========================================
  // DELETE
  // ========================================
  async remove(id: string, deletedBy: string) {
    const recce = await this.findOneWithRelations(id);
    if (!recce) throw new NotFoundException('Recce not found');

    const projectName = recce.project?.name || null;

    await recce.destroy();

    // === Activity Log & Notification ===
    await this.activityLogForSiteRecceService.logSiteRecceDeleted(
      id,
      projectName,
      { id: deletedBy },
    );
    await this.notificationForSiteRecceService.notifySiteRecceDeleted(
      id,
      projectName,
      deletedBy,
    );

    return { message: 'Site Recce deleted successfully' };
  }

  // ========================================
  // ADDITIONAL HELPER METHODS
  // ========================================
  async addFloor(recceId: string, floorData: any) {
    const recce = await this.siteRecceModel.findByPk(recceId);
    if (!recce) throw new NotFoundException('Recce not found');
    return this.floorModel.create({ ...floorData, site_recce_id: recceId });
  }

  async addRoom(floorId: string, roomData: any) {
    return this.roomModel.create({ ...roomData, floor_id: floorId });
  }

  async addLayoutAttachment(
    recceId: string,
    layoutData: any,
    createdBy: string,
  ) {
    return this.layoutModel.create({
      ...layoutData,
      site_recce_id: recceId,
      created_by: createdBy,
    });
  }
}

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
import { DocumentsService } from '../documents/document.service';
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
    private readonly sequelize: Sequelize,
    private readonly documentsService: DocumentsService,
  ) {}

  // ========================================
  // CREATE FULL RECCE WITH IMAGE UPLOADS
  // ========================================
  async createFullRecce(
    createData: any,
    createdBy: string,
    files?: { layoutImages?: Express.Multer.File[] },
  ) {
    const transaction = await this.sequelize.transaction();

    try {
      // 1. Create Main Recce
      const recce = await this.siteRecceModel.create(
        {
          ...createData,
          created_by: createdBy,
          updated_by: createdBy,
        } as any,
        { transaction },
      );

      // 2. Create Floors + Rooms
      if (createData.floors && Array.isArray(createData.floors)) {
        for (const floorData of createData.floors) {
          const floor = await this.floorModel.create(
            {
              ...floorData,
              site_recce_id: recce.id,
            } as any,
            { transaction },
          );

          if (floorData.rooms && Array.isArray(floorData.rooms)) {
            for (const roomData of floorData.rooms) {
              await this.roomModel.create(
                {
                  ...roomData,
                  floor_id: floor.id,
                } as any,
                { transaction },
              );
            }
          }
        }
      }

      // 3. Create Layout Attachments + Upload Images via DocumentsService
      const layoutImages = files?.layoutImages || [];
      let imageFileIndex = 0;

      if (
        createData.layoutAttachments &&
        Array.isArray(createData.layoutAttachments)
      ) {
        for (const layoutData of createData.layoutAttachments) {
          const imagesMeta: any[] = Array.isArray(layoutData.images)
            ? layoutData.images
            : [];

          // Every image becomes a real Document row (uploaded to CDN via
          // DocumentsService), so SiteImageAttachment can point at it with
          // document_id, same pattern as SiteLayoutAttachment.document_id.
          let layoutDocumentId: string | undefined;
          const createdImageDocs: { documentId: string; meta: any }[] = [];

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
              } as any,
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
              `Layout "${layoutData.title || ''}" requires at least one image file`,
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

      // 4. Create Additional Documents (if any)
      if (createData.documents && Array.isArray(createData.documents)) {
        for (const docData of createData.documents) {
          await this.documentModel.create(
            {
              ...docData,
              site_recce_id: recce.id,
            } as any,
            { transaction },
          );
        }
      }

      await transaction.commit();

      return this.findOneWithRelations(recce.id);
    } catch (error: unknown) {
      await transaction.rollback();
      console.error('Create Full Recce Error:', error);

      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';

      throw new BadRequestException(`Failed to create recce: ${message}`);
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
          include: [SiteImageAttachment],
        },
        SiteRecceDocument,
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
        SiteRecceDocument,
      ],
      order: [
        ['recce_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  // ========================================
  // UPDATE RECCE
  // ========================================
  async update(id: string, updateData: any, updatedBy: string) {
    const recce = await this.siteRecceModel.findByPk(id);
    if (!recce) throw new NotFoundException('Recce not found');

    await recce.update({
      ...updateData,
      updated_by: updatedBy,
    });

    return this.findOneWithRelations(id);
  }

  // ========================================
  // DELETE RECCE
  // ========================================
  async remove(id: string) {
    const recce = await this.siteRecceModel.findByPk(id);
    if (!recce) throw new NotFoundException('Recce not found');

    await recce.destroy();
    return { message: 'Site Recce deleted successfully' };
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

    await recce.update({ status, updated_by: updatedBy });
    return recce;
  }

  // ========================================
  // ADD FLOOR
  // ========================================
  async addFloor(recceId: string, floorData: any) {
    const recce = await this.siteRecceModel.findByPk(recceId);
    if (!recce) throw new NotFoundException('Recce not found');

    return this.floorModel.create({
      ...floorData,
      site_recce_id: recceId,
    } as any);
  }

  // ========================================
  // ADD ROOM
  // ========================================
  async addRoom(floorId: string, roomData: any) {
    return this.roomModel.create({
      ...roomData,
      floor_id: floorId,
    } as any);
  }

  // ========================================
  // ADD LAYOUT ATTACHMENT
  // ========================================
  async addLayoutAttachment(
    recceId: string,
    layoutData: any,
    createdBy: string,
  ) {
    return this.layoutModel.create({
      ...layoutData,
      site_recce_id: recceId,
      created_by: createdBy,
    } as any);
  }
}

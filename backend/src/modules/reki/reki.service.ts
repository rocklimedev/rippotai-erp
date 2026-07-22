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
    @InjectModel(Document) // ← Inject Document model if needed for direct queries
    private readonly documentModelDirect: typeof Document,
    private readonly sequelize: Sequelize,
    private readonly documentsService: DocumentsService,
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
      return this.findOneWithRelations(recce.id);
    } catch (error: unknown) {
      await transaction.rollback();
      console.error('Create Full Recce Error:', error);
      throw new BadRequestException(
        `Failed to create recce: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // ========================================
  // FIND ONE WITH ALL RELATIONS (incl. Project + Documents)
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
              include: [
                {
                  model: Document,
                },
              ],
            },
            {
              model: Document,
            },
          ],
        },
        {
          model: SiteRecceDocument,
          include: [
            {
              model: Document, // ← Fetch full Document details
              as: 'document', // Adjust alias based on your SiteRecceDocument association
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
                // Add any other fields you need
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
  // FIND ALL (incl. Project + Documents)
  // ========================================
  async findAll(projectId?: string, status?: string) {
    const where: any = {};
    if (projectId) where.project_id = projectId;
    if (status) where.status = status;

    return this.siteRecceModel.findAll({
      where,
      include: [
        {
          model: SiteRecceFloor,
          include: [SiteRecceRoom],
        },
        {
          model: SiteLayoutAttachment,
          include: [SiteImageAttachment],
        },
        {
          model: SiteRecceDocument,
          include: [
            {
              model: Document, // ← Fetch full Document details
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
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [
        ['recce_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  // ========================================
  // UPDATE & OTHER METHODS (unchanged)
  // ========================================
  async update(id: string, updateData: any, updatedBy: string) {
    const recce = await this.siteRecceModel.findByPk(id);
    if (!recce) throw new NotFoundException('Recce not found');
    await recce.update({ ...updateData, updated_by: updatedBy });
    return this.findOneWithRelations(id);
  }

  async remove(id: string) {
    const recce = await this.siteRecceModel.findByPk(id);
    if (!recce) throw new NotFoundException('Recce not found');
    await recce.destroy();
    return { message: 'Site Recce deleted successfully' };
  }

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

  async addFloor(recceId: string, floorData: any) {
    const recce = await this.siteRecceModel.findByPk(recceId);
    if (!recce) throw new NotFoundException('Recce not found');
    return this.floorModel.create({
      ...floorData,
      site_recce_id: recceId,
    });
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

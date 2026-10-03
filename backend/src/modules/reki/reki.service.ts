import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';

import { SiteRecce } from './models/site-recce.model';
import { SiteRecceRoom } from './models/site-recce-room.model';
import { SiteReccePhoto } from './models/site-recce-photo.model';

import { Project } from '@/modules/projects/models/projects.model';
import { User } from '@/modules/users/models/user.model';

import { CreateSiteRecceDto } from './dto/create-site-recce.dto';
import { UpdateSiteRecceDto } from './dto/update-site-recce.dto';

import { CdnService } from '@/modules/cdn/cdn.service';

@Injectable()
export class SiteRecceService {
  constructor(
    private readonly sequelize: Sequelize,
    private readonly cdnService: CdnService,
  ) {}

  // ============================================================
  // CREATE SITE RECCE
  // ============================================================

  async create(dto: CreateSiteRecceDto, userId?: string): Promise<SiteRecce> {
    const transaction = await this.sequelize.transaction();

    try {
      // --------------------------------------------------------
      // Validate project
      // --------------------------------------------------------

      const project = await Project.findByPk(dto.project_id, {
        transaction,
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      // --------------------------------------------------------
      // Prevent duplicate site recce
      // --------------------------------------------------------

      const existing = await SiteRecce.findOne({
        where: {
          project_id: dto.project_id,
        },
        transaction,
      });

      if (existing) {
        throw new BadRequestException(
          'A Site Recce already exists for this project',
        );
      }

      // --------------------------------------------------------
      // Create master record
      // --------------------------------------------------------

      const recce = await SiteRecce.create(
        {
          project_id: dto.project_id,

          project_name: dto.project_name ?? project.name,

          client_name: dto.client_name ?? null,

          site_address: dto.site_address ?? project.site_location,

          recce_date: dto.recce_date,

          site_engineer_id: dto.site_engineer_id ?? null,

          accompanied_by: dto.accompanied_by ?? null,

          unit_floor_no: dto.unit_floor_no ?? null,

          carpet_area_sqft: dto.carpet_area_sqft ?? null,

          built_up_area_sqft: dto.built_up_area_sqft ?? null,

          number_of_rooms: dto.number_of_rooms ?? null,

          number_of_floors: dto.number_of_floors ?? null,

          site_type: dto.site_type ?? null,

          lift_available: dto.lift_available ?? null,

          lift_size: dto.lift_size ?? null,

          staircase_width: dto.staircase_width ?? null,

          material_entry_point: dto.material_entry_point ?? null,

          water_connection: dto.water_connection ?? null,

          power_load_available: dto.power_load_available ?? null,

          drainage_point_location: dto.drainage_point_location ?? null,

          society_rwa_restrictions: dto.society_rwa_restrictions ?? null,

          working_hours_allowed: dto.working_hours_allowed ?? null,

          material_movement_rule: dto.material_movement_rule ?? null,

          existing_condition: dto.existing_condition ?? null,

          created_by: userId ?? null,

          updated_by: userId ?? null,
        } as any,
        {
          transaction,
        },
      );

      // --------------------------------------------------------
      // Create rooms
      // --------------------------------------------------------

      if (dto.rooms?.length) {
        await this.createRooms(recce.id, dto.rooms, transaction);
      }

      // --------------------------------------------------------
      // Commit
      // --------------------------------------------------------

      await transaction.commit();

      // --------------------------------------------------------
      // Return complete record
      // --------------------------------------------------------

      return this.findOne(recce.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // CREATE ROOMS
  // ============================================================

  private async createRooms(
    siteRecceId: string,
    rooms: any[],
    transaction: Transaction,
  ): Promise<void> {
    for (let index = 0; index < rooms.length; index++) {
      const roomDto = rooms[index];

      // --------------------------------------------------------
      // Validate room
      // --------------------------------------------------------

      if (!roomDto?.room_name) {
        throw new BadRequestException(
          `Room ${index + 1}: room_name is required`,
        );
      }

      // --------------------------------------------------------
      // Create room
      // --------------------------------------------------------

      const room = await SiteRecceRoom.create(
        {
          site_recce_id: siteRecceId,

          room_name: roomDto.room_name,

          room_type: roomDto.room_type ?? null,

          room_number: roomDto.room_number ?? null,

          length: roomDto.length ?? null,

          width: roomDto.width ?? null,

          height: roomDto.height ?? null,

          measurement_unit: roomDto.measurement_unit ?? 'FT',

          existing_flooring: roomDto.existing_flooring ?? null,

          existing_ceiling: roomDto.existing_ceiling ?? null,

          notes: roomDto.notes ?? null,

          sort_order: roomDto.sort_order ?? index,
        } as any,
        {
          transaction,
        },
      );

      // --------------------------------------------------------
      // Create photos
      // --------------------------------------------------------

      if (Array.isArray(roomDto.photos) && roomDto.photos.length) {
        await this.createPhotos(
          siteRecceId,
          room.id,
          roomDto.photos,
          transaction,
        );
      }
    }
  }

  // ============================================================
  // CREATE PHOTOS
  // ============================================================

  private async createPhotos(
    siteRecceId: string,
    roomId: string,
    photos: any[],
    transaction: Transaction,
  ): Promise<void> {
    for (let index = 0; index < photos.length; index++) {
      const photoDto = photos[index];

      // --------------------------------------------------------
      // Automatically determine shot number
      //
      // Priority:
      // 1. shot_number
      // 2. shotNumber
      // 3. array index + 1
      // --------------------------------------------------------

      const rawShotNumber =
        photoDto?.shot_number ?? photoDto?.shotNumber ?? index + 1;

      const shotNumber = Number(rawShotNumber);

      // --------------------------------------------------------
      // Validate shot number
      // --------------------------------------------------------

      if (!Number.isInteger(shotNumber) || shotNumber < 1) {
        throw new BadRequestException(
          `Invalid shot_number for photo ${index + 1}`,
        );
      }

      // --------------------------------------------------------
      // Prevent duplicate shot number inside same room
      // --------------------------------------------------------

      const duplicate = await SiteReccePhoto.findOne({
        where: {
          room_id: roomId,
          shot_number: shotNumber,
        },
        transaction,
      });

      if (duplicate) {
        throw new BadRequestException(
          `Shot ${shotNumber} already exists for this room`,
        );
      }

      // --------------------------------------------------------
      // Create photo
      // --------------------------------------------------------

      await SiteReccePhoto.create(
        {
          site_recce_id: siteRecceId,

          room_id: roomId,

          shot_number: shotNumber,

          layout_image_url: photoDto?.layout_image_url ?? null,

          photo_url: photoDto?.photo_url ?? null,

          layout_file_name: photoDto?.layout_file_name ?? null,

          photo_file_name: photoDto?.photo_file_name ?? null,

          standing_position: photoDto?.standing_position ?? null,

          camera_direction: photoDto?.camera_direction ?? null,

          notes: photoDto?.notes ?? null,
        } as any,
        {
          transaction,
        },
      );
    }
  }

  // ============================================================
  // UPLOAD PHOTO + CREATE PHOTO RECORD
  // ============================================================

  async uploadAndCreatePhoto(
    siteRecceId: string,
    roomId: string,
    file: Express.Multer.File,
    shotNumber: number,
    data?: {
      standing_position?: string;
      camera_direction?: string;
      notes?: string;
    },
  ): Promise<SiteReccePhoto> {
    // --------------------------------------------------------
    // Validate file
    // --------------------------------------------------------

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // --------------------------------------------------------
    // Validate Site Recce
    // --------------------------------------------------------

    const recce = await SiteRecce.findByPk(siteRecceId);

    if (!recce) {
      throw new NotFoundException('Site Recce not found');
    }

    // --------------------------------------------------------
    // Validate room
    // --------------------------------------------------------

    const room = await SiteRecceRoom.findOne({
      where: {
        id: roomId,
        site_recce_id: siteRecceId,
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found for this Site Recce');
    }

    // --------------------------------------------------------
    // Validate shot number
    // --------------------------------------------------------

    const parsedShotNumber = Number(shotNumber);

    if (!Number.isInteger(parsedShotNumber) || parsedShotNumber < 1) {
      throw new BadRequestException('shot_number must be a positive integer');
    }

    // --------------------------------------------------------
    // Check duplicate shot
    // --------------------------------------------------------

    const existing = await SiteReccePhoto.findOne({
      where: {
        room_id: roomId,
        shot_number: parsedShotNumber,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Shot ${parsedShotNumber} already exists for this room`,
      );
    }

    // --------------------------------------------------------
    // Upload to CDN
    // --------------------------------------------------------

    const upload = await this.cdnService.uploadFile(file);

    // --------------------------------------------------------
    // Create DB record
    // --------------------------------------------------------

    const photo = await SiteReccePhoto.create({
      site_recce_id: siteRecceId,

      room_id: roomId,

      shot_number: parsedShotNumber,

      photo_url: upload.url,

      photo_file_name: upload.filename,

      layout_image_url: null,

      layout_file_name: null,

      standing_position: data?.standing_position ?? null,

      camera_direction: data?.camera_direction ?? null,

      notes: data?.notes ?? null,
    } as any);

    return photo;
  }

  // ============================================================
  // UPLOAD PHOTO ONLY
  // ============================================================

  async uploadPhoto(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    return this.cdnService.uploadFile(file);
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(): Promise<SiteRecce[]> {
    return SiteRecce.findAll({
      include: [
        // ------------------------------------------------------
        // Project
        // ------------------------------------------------------

        {
          model: Project,
          as: 'project',
        },

        // ------------------------------------------------------
        // Site Engineer
        // ------------------------------------------------------

        {
          model: User,
          as: 'site_engineer',
          attributes: ['id', 'name', 'email'],
        },

        // ------------------------------------------------------
        // Rooms
        // ------------------------------------------------------

        {
          model: SiteRecceRoom,
          as: 'rooms',

          include: [
            {
              model: SiteReccePhoto,
              as: 'photos',
            },
          ],
        },
      ],

      order: [
        ['recce_date', 'DESC'],

        [
          {
            model: SiteRecceRoom,
            as: 'rooms',
          },
          'sort_order',
          'ASC',
        ],

        [
          {
            model: SiteRecceRoom,
            as: 'rooms',
          },
          {
            model: SiteReccePhoto,
            as: 'photos',
          },
          'shot_number',
          'ASC',
        ],
      ],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string): Promise<SiteRecce> {
    const recce = await SiteRecce.findByPk(id, {
      include: [
        // ------------------------------------------------------
        // Project
        // ------------------------------------------------------

        {
          model: Project,
          as: 'project',
        },

        // ------------------------------------------------------
        // Site Engineer
        // ------------------------------------------------------

        {
          model: User,
          as: 'site_engineer',
          attributes: ['id', 'name', 'email'],
        },

        // ------------------------------------------------------
        // Rooms + Photos
        // ------------------------------------------------------

        {
          model: SiteRecceRoom,
          as: 'rooms',

          include: [
            {
              model: SiteReccePhoto,
              as: 'photos',
            },
          ],
        },
      ],

      order: [
        [
          {
            model: SiteRecceRoom,
            as: 'rooms',
          },
          'sort_order',
          'ASC',
        ],

        [
          {
            model: SiteRecceRoom,
            as: 'rooms',
          },
          {
            model: SiteReccePhoto,
            as: 'photos',
          },
          'shot_number',
          'ASC',
        ],
      ],
    });

    if (!recce) {
      throw new NotFoundException('Site Recce not found');
    }

    return recce;
  }

  // ============================================================
  // FIND BY PROJECT
  // ============================================================

  async findByProject(projectId: string): Promise<SiteRecce | null> {
    return SiteRecce.findOne({
      where: {
        project_id: projectId,
      },

      include: [
        // ------------------------------------------------------
        // Project
        // ------------------------------------------------------

        {
          model: Project,
          as: 'project',
        },

        // ------------------------------------------------------
        // Site Engineer
        // ------------------------------------------------------

        {
          model: User,
          as: 'site_engineer',
          attributes: ['id', 'name', 'email'],
        },

        // ------------------------------------------------------
        // Rooms + Photos
        // ------------------------------------------------------

        {
          model: SiteRecceRoom,
          as: 'rooms',

          include: [
            {
              model: SiteReccePhoto,
              as: 'photos',
            },
          ],
        },
      ],

      order: [
        [
          {
            model: SiteRecceRoom,
            as: 'rooms',
          },
          'sort_order',
          'ASC',
        ],

        [
          {
            model: SiteRecceRoom,
            as: 'rooms',
          },
          {
            model: SiteReccePhoto,
            as: 'photos',
          },
          'shot_number',
          'ASC',
        ],
      ],
    });
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateSiteRecceDto,
    userId?: string,
  ): Promise<SiteRecce> {
    const transaction = await this.sequelize.transaction();

    try {
      // --------------------------------------------------------
      // Find existing recce
      // --------------------------------------------------------

      const recce = await SiteRecce.findByPk(id, {
        transaction,
      });

      if (!recce) {
        throw new NotFoundException('Site Recce not found');
      }

      // --------------------------------------------------------
      // Master fields
      // --------------------------------------------------------

      const masterData: Record<string, any> = {};

      const fields = [
        'project_name',
        'client_name',
        'site_address',
        'recce_date',
        'site_engineer_id',
        'accompanied_by',
        'unit_floor_no',
        'carpet_area_sqft',
        'built_up_area_sqft',
        'number_of_rooms',
        'number_of_floors',
        'site_type',
        'lift_available',
        'lift_size',
        'staircase_width',
        'material_entry_point',
        'water_connection',
        'power_load_available',
        'drainage_point_location',
        'society_rwa_restrictions',
        'working_hours_allowed',
        'material_movement_rule',
        'existing_condition',
      ];

      for (const field of fields) {
        if ((dto as any)[field] !== undefined) {
          masterData[field] = (dto as any)[field];
        }
      }

      // --------------------------------------------------------
      // Updated by
      // --------------------------------------------------------

      if (userId) {
        masterData.updated_by = userId;
      }

      // --------------------------------------------------------
      // Update master
      // --------------------------------------------------------

      if (Object.keys(masterData).length) {
        await recce.update(masterData, {
          transaction,
        });
      }

      // --------------------------------------------------------
      // Replace rooms
      //
      // undefined = don't touch existing rooms
      // []        = remove all rooms
      // array     = replace rooms
      // --------------------------------------------------------

      if (dto.rooms !== undefined) {
        await SiteRecceRoom.destroy({
          where: {
            site_recce_id: id,
          },
          transaction,
        });

        if (dto.rooms.length) {
          await this.createRooms(id, dto.rooms, transaction);
        }
      }

      // --------------------------------------------------------
      // Commit
      // --------------------------------------------------------

      await transaction.commit();

      return this.findOne(id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string): Promise<void> {
    const recce = await SiteRecce.findByPk(id);

    if (!recce) {
      throw new NotFoundException('Site Recce not found');
    }

    await recce.destroy();
  }

  // ============================================================
  // RESTORE
  // ============================================================

  async restore(id: string): Promise<SiteRecce> {
    const recce = await SiteRecce.findOne({
      where: {
        id,
      },

      paranoid: false,
    });

    if (!recce) {
      throw new NotFoundException('Site Recce not found');
    }

    await recce.restore();

    return this.findOne(id);
  }

  // ============================================================
  // DELETE PHOTO
  // ============================================================

  async removePhoto(photoId: string): Promise<void> {
    const photo = await SiteReccePhoto.findByPk(photoId);

    if (!photo) {
      throw new NotFoundException('Site Recce photo not found');
    }

    // --------------------------------------------------------
    // Delete physical photo from CDN
    // --------------------------------------------------------

    if (photo.photo_file_name) {
      await this.cdnService.deleteFile(photo.photo_file_name);
    }

    // --------------------------------------------------------
    // Delete layout file from CDN
    // --------------------------------------------------------

    if (photo.layout_file_name) {
      await this.cdnService.deleteFile(photo.layout_file_name);
    }

    // --------------------------------------------------------
    // Delete DB record
    // --------------------------------------------------------

    await photo.destroy();
  }

  // ============================================================
  // UPLOAD LAYOUT IMAGE
  // ============================================================

  async uploadLayoutImage(
    photoId: string,
    file: Express.Multer.File,
  ): Promise<SiteReccePhoto> {
    // --------------------------------------------------------
    // Validate file
    // --------------------------------------------------------

    if (!file) {
      throw new BadRequestException('Layout image is required');
    }

    // --------------------------------------------------------
    // Find photo
    // --------------------------------------------------------

    const photo = await SiteReccePhoto.findByPk(photoId);

    if (!photo) {
      throw new NotFoundException('Site Recce photo not found');
    }

    // --------------------------------------------------------
    // Upload new layout
    // --------------------------------------------------------

    const upload = await this.cdnService.uploadFile(file);

    // --------------------------------------------------------
    // Delete previous layout
    // --------------------------------------------------------

    if (photo.layout_file_name) {
      await this.cdnService.deleteFile(photo.layout_file_name);
    }

    // --------------------------------------------------------
    // Update DB
    // --------------------------------------------------------

    await photo.update({
      layout_image_url: upload.url,
      layout_file_name: upload.filename,
    } as any);

    return photo;
  }

  // ============================================================
  // REPLACE PHOTO IMAGE
  // ============================================================

  async replacePhoto(
    photoId: string,
    file: Express.Multer.File,
  ): Promise<SiteReccePhoto> {
    // --------------------------------------------------------
    // Validate file
    // --------------------------------------------------------

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // --------------------------------------------------------
    // Find existing photo
    // --------------------------------------------------------

    const photo = await SiteReccePhoto.findByPk(photoId);

    if (!photo) {
      throw new NotFoundException('Site Recce photo not found');
    }

    // --------------------------------------------------------
    // Upload new image
    // --------------------------------------------------------

    const upload = await this.cdnService.uploadFile(file);

    // --------------------------------------------------------
    // Delete old CDN file
    // --------------------------------------------------------

    if (photo.photo_file_name) {
      await this.cdnService.deleteFile(photo.photo_file_name);
    }

    // --------------------------------------------------------
    // Update DB
    // --------------------------------------------------------

    await photo.update({
      photo_url: upload.url,
      photo_file_name: upload.filename,
    } as any);

    return photo;
  }
}

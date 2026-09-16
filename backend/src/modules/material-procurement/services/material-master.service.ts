import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { MaterialMaster } from '../models/material-master.model';
import {
  CreateMaterialMasterDto,
  UpdateMaterialMasterDto,
} from '../dto/material-master.dto';

import { Vendor } from '@/modules/vendors/models/vendors.model';
import { Unit } from '@/modules/metas/models/unit.model';

@Injectable()
export class MaterialMasterService {
  constructor(
    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,

    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,

    @InjectModel(Unit)
    private readonly unitModel: typeof Unit,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(
    dto: CreateMaterialMasterDto,
    userId?: string,
  ): Promise<MaterialMaster> {
    const existing = await this.materialModel.findOne({
      where: {
        material_code: dto.material_code,
      },
    });

    if (existing) {
      throw new ConflictException('Material code already exists');
    }

    // ----------------------------------------------------------
    // Validate vendor if provided
    // ----------------------------------------------------------

    if (dto.vendor_id) {
      await this.validateVendor(dto.vendor_id);
    }

    // ----------------------------------------------------------
    // Validate unit
    // ----------------------------------------------------------

    await this.validateUnit(dto.unit_id);

    // ----------------------------------------------------------
    // Validate price
    // ----------------------------------------------------------

    this.validatePrice(dto.price);

    // ----------------------------------------------------------
    // Create material
    // ----------------------------------------------------------

    const material = await this.materialModel.create({
      ...dto,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    });

    // ----------------------------------------------------------
    // Return with relationships
    // ----------------------------------------------------------

    return this.findOne(material.id);
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(params?: {
    search?: string;
    category?: string;
    vendor_id?: string;
    unit_id?: string;
    is_active?: boolean;
  }): Promise<MaterialMaster[]> {
    const where: any = {};

    // ----------------------------------------------------------
    // Category filter
    // ----------------------------------------------------------

    if (params?.category) {
      where.category = params.category;
    }

    // ----------------------------------------------------------
    // Vendor filter
    // ----------------------------------------------------------

    if (params?.vendor_id) {
      where.vendor_id = params.vendor_id;
    }

    // ----------------------------------------------------------
    // Unit filter
    // ----------------------------------------------------------

    if (params?.unit_id) {
      where.unit_id = params.unit_id;
    }

    // ----------------------------------------------------------
    // Active filter
    // ----------------------------------------------------------

    if (params?.is_active !== undefined) {
      where.is_active = params.is_active;
    }

    // ----------------------------------------------------------
    // Search
    // ----------------------------------------------------------

    if (params?.search) {
      where[Op.or] = [
        {
          name: {
            [Op.like]: `%${params.search}%`,
          },
        },
        {
          material_code: {
            [Op.like]: `%${params.search}%`,
          },
        },
        {
          brand: {
            [Op.like]: `%${params.search}%`,
          },
        },
        {
          model: {
            [Op.like]: `%${params.search}%`,
          },
        },
        {
          hsn_code: {
            [Op.like]: `%${params.search}%`,
          },
        },
      ];
    }

    return this.materialModel.findAll({
      where,
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false,
        },
        {
          model: Unit,
          as: 'unit',
          required: true,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string): Promise<MaterialMaster> {
    const material = await this.materialModel.findByPk(id, {
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false,
        },
        {
          model: Unit,
          as: 'unit',
          required: true,
        },
      ],
    });

    if (!material) {
      throw new NotFoundException('Material master not found');
    }

    return material;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(
    id: string,
    dto: UpdateMaterialMasterDto,
    userId?: string,
  ): Promise<MaterialMaster> {
    const material = await this.findOne(id);

    // ----------------------------------------------------------
    // Check material code uniqueness if being changed
    // ----------------------------------------------------------

    if (dto.material_code && dto.material_code !== material.material_code) {
      const existing = await this.materialModel.findOne({
        where: {
          material_code: dto.material_code,
          id: {
            [Op.ne]: id,
          },
        },
      });

      if (existing) {
        throw new ConflictException('Material code already exists');
      }
    }

    // ----------------------------------------------------------
    // Validate vendor if being changed
    // ----------------------------------------------------------

    if (dto.vendor_id !== undefined && dto.vendor_id !== null) {
      await this.validateVendor(dto.vendor_id);
    }

    // ----------------------------------------------------------
    // Validate unit if being changed
    // ----------------------------------------------------------

    if (dto.unit_id !== undefined) {
      await this.validateUnit(dto.unit_id);
    }

    // ----------------------------------------------------------
    // Validate price if being changed
    // ----------------------------------------------------------

    if (dto.price !== undefined) {
      this.validatePrice(dto.price);
    }

    // ----------------------------------------------------------
    // Update material
    // ----------------------------------------------------------

    await material.update({
      ...dto,
      updated_by: userId ?? null,
    });

    // ----------------------------------------------------------
    // Reload with relationships
    // ----------------------------------------------------------

    await material.reload({
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: false,
        },
        {
          model: Unit,
          as: 'unit',
          required: true,
        },
      ],
    });

    return material;
  }

  // ============================================================
  // DEACTIVATE
  // ============================================================

  async deactivate(id: string, userId?: string): Promise<MaterialMaster> {
    const material = await this.findOne(id);

    await material.update({
      is_active: false,
      updated_by: userId ?? null,
    });

    return material;
  }

  // ============================================================
  // VALIDATE VENDOR
  // ============================================================

  private async validateVendor(vendorId: string): Promise<void> {
    const vendor = await this.vendorModel.findByPk(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
  }

  // ============================================================
  // VALIDATE UNIT
  // ============================================================

  private async validateUnit(unitId: string): Promise<void> {
    const unit = await this.unitModel.findByPk(unitId);

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    if (!unit.is_active) {
      throw new ConflictException('Unit is inactive');
    }
  }

  // ============================================================
  // VALIDATE PRICE
  // ============================================================

  private validatePrice(price: number | null | undefined): void {
    // Price is optional
    if (price === null || price === undefined) {
      return;
    }

    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new ConflictException('Price must be a valid number');
    }

    if (price < 0) {
      throw new ConflictException('Price cannot be negative');
    }

    // Maximum supported by DECIMAL(15,2)
    if (price > 9999999999999.99) {
      throw new ConflictException('Price exceeds the maximum allowed value');
    }
  }
}

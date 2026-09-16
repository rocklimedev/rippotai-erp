import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { MaterialMaster } from '../models/material-master.model';
import { MaterialVendor } from '../models/material-vendor.model';

import {
  AddMaterialVendorDto,
  CreateMaterialMasterDto,
  UpdateMaterialMasterDto,
  UpdateMaterialVendorDto,
} from '../dto/material-master.dto';

import { Vendor } from '@/modules/vendors/models/vendors.model';
import { Unit } from '@/modules/metas/models/unit.model';

@Injectable()
export class MaterialMasterService {
  constructor(
    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,

    @InjectModel(MaterialVendor)
    private readonly materialVendorModel: typeof MaterialVendor,

    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,

    @InjectModel(Unit)
    private readonly unitModel: typeof Unit,
  ) {}

  // ============================================================
  // CREATE MATERIAL MASTER
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

    await this.validateUnit(dto.unit_id);

    const material = await this.materialModel.create({
      material_code: dto.material_code,
      name: dto.name,
      category: dto.category ?? null,
      sub_category: dto.sub_category ?? null,
      brand: dto.brand ?? null,
      model: dto.model ?? null,
      specification: dto.specification ?? null,
      unit_id: dto.unit_id,
      hsn_code: dto.hsn_code ?? null,
      description: dto.description ?? null,
      is_active: dto.is_active ?? true,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    });

    return this.findOne(material.id);
  }

  // ============================================================
  // FIND ALL MATERIALS
  //
  // RESPONSE:
  //
  // [
  //   {
  //     material fields...,
  //     vendors: [
  //       {
  //         material vendor fields...,
  //         vendor: {
  //           vendor fields...
  //         }
  //       }
  //     ],
  //     unit: {
  //       ...
  //     }
  //   }
  // ]
  //
  // ============================================================

  async findAll(params?: {
    search?: string;
    category?: string;
    vendor_id?: string;
    unit_id?: string;
    is_active?: boolean;
  }): Promise<MaterialMaster[]> {
    const where: any = {};

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.unit_id) {
      where.unit_id = params.unit_id;
    }

    if (params?.is_active !== undefined) {
      where.is_active = params.is_active;
    }

    if (params?.search?.trim()) {
      const search = params.search.trim();

      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { material_code: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { category: { [Op.like]: `%${search}%` } },
        { sub_category: { [Op.like]: `%${search}%` } },
        { hsn_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const materials = await this.materialModel.findAll({
      where,

      attributes: [
        'id',
        'material_code',
        'name',
        'category',
        'sub_category',
        'brand',
        'model',
        'specification',
        'unit_id',
        'hsn_code',
        'description',
        'is_active',
        'created_by',
        'updated_by',
        'createdAt',
        'updatedAt',
      ],

      include: [
        {
          model: Unit,
          as: 'unit',
          required: true,
        },

        {
          model: MaterialVendor,
          as: 'vendors',

          // IMPORTANT:
          // Do NOT put vendor_id filtering here unless
          // you specifically want to return only that vendor.
          required: false,

          attributes: [
            'id',
            'material_id',
            'vendor_id',
            'vendor_material_code',
            'price',
            'discount_percent',
            'lead_time_days',
            'is_preferred',
            'is_active',
            'created_by',
            'updated_by',
            'createdAt',
            'updatedAt',
          ],

          include: [
            {
              model: Vendor,
              as: 'vendor',
              required: true,

              attributes: [
                'id',
                'name',
                'company_name',
                'position',
                'designation',
                'vendor_category_id',
                'business_type_id',
                'contact_number',
                'alternate_contact',
                'address',
                'state',
                'country',
                'notes',
                'status',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
              ],
            },
          ],
        },
      ],

      order: [['name', 'ASC']],
    });

    // Sequelize nested include ordering can be unreliable,
    // so explicitly order vendors here.
    for (const material of materials) {
      if (material.vendors) {
        material.vendors.sort((a, b) => {
          // Preferred first
          if (a.is_preferred !== b.is_preferred) {
            return a.is_preferred ? -1 : 1;
          }

          // Active first
          if (a.is_active !== b.is_active) {
            return a.is_active ? -1 : 1;
          }

          // Then oldest relationship first
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });
      }
    }

    return materials;
  }

  // ============================================================
  // FIND ONE MATERIAL
  //
  // ROOT OBJECT = MaterialMaster
  //
  // ============================================================

  async findOne(id: string): Promise<MaterialMaster> {
    const material = await this.materialModel.findByPk(id, {
      attributes: [
        'id',
        'material_code',
        'name',
        'category',
        'sub_category',
        'brand',
        'model',
        'specification',
        'unit_id',
        'hsn_code',
        'description',
        'is_active',
        'created_by',
        'updated_by',
        'createdAt',
        'updatedAt',
      ],

      include: [
        // ------------------------------------------------------
        // VENDORS
        // ------------------------------------------------------

        {
          model: MaterialVendor,
          as: 'vendors',
          required: false,

          attributes: [
            'id',
            'material_id',
            'vendor_id',
            'vendor_material_code',
            'price',
            'discount_percent',
            'lead_time_days',
            'is_preferred',
            'is_active',
            'created_by',
            'updated_by',
            'createdAt',
            'updatedAt',
          ],

          include: [
            {
              model: Vendor,
              as: 'vendor',
              required: false,
            },
          ],

          order: [
            ['is_preferred', 'DESC'],
            ['is_active', 'DESC'],
            ['createdAt', 'ASC'],
          ],
        },

        // ------------------------------------------------------
        // UNIT
        // ------------------------------------------------------

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
  // UPDATE MATERIAL MASTER
  // ============================================================

  async update(
    id: string,
    dto: UpdateMaterialMasterDto,
    userId?: string,
  ): Promise<MaterialMaster> {
    const material = await this.findOne(id);

    // ----------------------------------------------------------
    // MATERIAL CODE UNIQUENESS
    // ----------------------------------------------------------

    if (
      dto.material_code !== undefined &&
      dto.material_code !== material.material_code
    ) {
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
    // UNIT
    // ----------------------------------------------------------

    if (dto.unit_id !== undefined) {
      await this.validateUnit(dto.unit_id);
    }

    // ----------------------------------------------------------
    // UPDATE ONLY MATERIAL MASTER
    // ----------------------------------------------------------

    await material.update({
      ...(dto.material_code !== undefined && {
        material_code: dto.material_code,
      }),

      ...(dto.name !== undefined && {
        name: dto.name,
      }),

      ...(dto.category !== undefined && {
        category: dto.category,
      }),

      ...(dto.sub_category !== undefined && {
        sub_category: dto.sub_category,
      }),

      ...(dto.brand !== undefined && {
        brand: dto.brand,
      }),

      ...(dto.model !== undefined && {
        model: dto.model,
      }),

      ...(dto.specification !== undefined && {
        specification: dto.specification,
      }),

      ...(dto.unit_id !== undefined && {
        unit_id: dto.unit_id,
      }),

      ...(dto.hsn_code !== undefined && {
        hsn_code: dto.hsn_code,
      }),

      ...(dto.description !== undefined && {
        description: dto.description,
      }),

      ...(dto.is_active !== undefined && {
        is_active: dto.is_active,
      }),

      updated_by: userId ?? null,
    });

    return this.findOne(id);
  }

  // ============================================================
  // ADD VENDOR TO MATERIAL
  // ============================================================

  async addVendor(
    materialId: string,
    dto: AddMaterialVendorDto,
    userId?: string,
  ): Promise<MaterialVendor> {
    await this.findOne(materialId);

    await this.validateVendor(dto.vendor_id);

    this.validatePrice(dto.price);
    this.validateDiscount(dto.discount_percent);
    this.validateLeadTime(dto.lead_time_days);

    // ----------------------------------------------------------
    // DUPLICATE CHECK
    // ----------------------------------------------------------

    const existing = await this.materialVendorModel.findOne({
      where: {
        material_id: materialId,
        vendor_id: dto.vendor_id,
      },
    });

    if (existing) {
      throw new ConflictException(
        'This vendor is already associated with this material',
      );
    }

    // ----------------------------------------------------------
    // ACTIVE STATE
    // ----------------------------------------------------------

    const isActive = dto.is_active ?? true;

    // ----------------------------------------------------------
    // CHECK CURRENT ACTIVE VENDOR
    // ----------------------------------------------------------

    const activeVendorCount = await this.materialVendorModel.count({
      where: {
        material_id: materialId,
        is_active: true,
      },
    });

    // ----------------------------------------------------------
    // PREFERRED LOGIC
    //
    // First active vendor automatically becomes preferred.
    // Explicit preferred=true also makes it preferred.
    //
    // Inactive vendor can NEVER be preferred.
    // ----------------------------------------------------------

    const shouldBePreferred =
      isActive && (dto.is_preferred === true || activeVendorCount === 0);

    if (shouldBePreferred) {
      await this.clearPreferredVendors(materialId, userId);
    }

    // ----------------------------------------------------------
    // CREATE RELATIONSHIP
    // ----------------------------------------------------------

    const materialVendor = await this.materialVendorModel.create({
      material_id: materialId,
      vendor_id: dto.vendor_id,

      vendor_material_code: dto.vendor_material_code ?? null,

      price: dto.price ?? null,

      discount_percent: dto.discount_percent ?? null,

      lead_time_days: dto.lead_time_days ?? null,

      is_preferred: shouldBePreferred,

      is_active: isActive,

      created_by: userId ?? null,

      updated_by: userId ?? null,
    });

    // ----------------------------------------------------------
    // SAFETY
    // ----------------------------------------------------------

    await this.ensurePreferredVendor(materialId, userId);

    return this.getMaterialVendor(materialVendor.id);
  }

  // ============================================================
  // UPDATE MATERIAL VENDOR
  // ============================================================

  async updateVendor(
    materialId: string,
    materialVendorId: string,
    dto: UpdateMaterialVendorDto,
    userId?: string,
  ): Promise<MaterialVendor> {
    const materialVendor = await this.materialVendorModel.findOne({
      where: {
        id: materialVendorId,
        material_id: materialId,
      },
    });

    if (!materialVendor) {
      throw new NotFoundException('Material vendor relationship not found');
    }

    // ----------------------------------------------------------
    // VENDOR CHANGE
    // ----------------------------------------------------------

    if (
      dto.vendor_id !== undefined &&
      dto.vendor_id !== materialVendor.vendor_id
    ) {
      await this.validateVendor(dto.vendor_id);

      const duplicate = await this.materialVendorModel.findOne({
        where: {
          material_id: materialId,
          vendor_id: dto.vendor_id,
          id: {
            [Op.ne]: materialVendorId,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          'This vendor is already associated with this material',
        );
      }
    }

    // ----------------------------------------------------------
    // VALIDATIONS
    // ----------------------------------------------------------

    if (dto.price !== undefined) {
      this.validatePrice(dto.price);
    }

    if (dto.discount_percent !== undefined) {
      this.validateDiscount(dto.discount_percent);
    }

    if (dto.lead_time_days !== undefined) {
      this.validateLeadTime(dto.lead_time_days);
    }

    // ----------------------------------------------------------
    // DEACTIVATION
    // ----------------------------------------------------------

    if (dto.is_active === false) {
      await materialVendor.update({
        ...(dto.vendor_id !== undefined && {
          vendor_id: dto.vendor_id,
        }),

        ...(dto.vendor_material_code !== undefined && {
          vendor_material_code: dto.vendor_material_code,
        }),

        ...(dto.price !== undefined && {
          price: dto.price,
        }),

        ...(dto.discount_percent !== undefined && {
          discount_percent: dto.discount_percent,
        }),

        ...(dto.lead_time_days !== undefined && {
          lead_time_days: dto.lead_time_days,
        }),

        is_active: false,
        is_preferred: false,

        updated_by: userId ?? null,
      });

      await this.ensurePreferredVendor(materialId, userId);

      return this.getMaterialVendor(materialVendorId);
    }

    // ----------------------------------------------------------
    // PREFERRED VENDOR
    // ----------------------------------------------------------

    if (dto.is_preferred === true) {
      if (!materialVendor.is_active) {
        throw new ConflictException(
          'An inactive vendor cannot be set as preferred',
        );
      }

      await this.clearPreferredVendors(materialId, userId, materialVendorId);
    }

    // ----------------------------------------------------------
    // ACTIVATE VENDOR
    // ----------------------------------------------------------

    if (
      dto.is_active === true &&
      materialVendor.is_active === false &&
      dto.is_preferred !== true
    ) {
      const preferredVendor = await this.materialVendorModel.findOne({
        where: {
          material_id: materialId,
          is_active: true,
          is_preferred: true,
        },
      });

      if (!preferredVendor) {
        await this.clearPreferredVendors(materialId, userId);

        await materialVendor.update({
          is_preferred: true,
          updated_by: userId ?? null,
        });
      }
    }

    // ----------------------------------------------------------
    // NORMAL UPDATE
    // ----------------------------------------------------------

    await materialVendor.update({
      ...(dto.vendor_id !== undefined && {
        vendor_id: dto.vendor_id,
      }),

      ...(dto.vendor_material_code !== undefined && {
        vendor_material_code: dto.vendor_material_code,
      }),

      ...(dto.price !== undefined && {
        price: dto.price,
      }),

      ...(dto.discount_percent !== undefined && {
        discount_percent: dto.discount_percent,
      }),

      ...(dto.lead_time_days !== undefined && {
        lead_time_days: dto.lead_time_days,
      }),

      ...(dto.is_preferred !== undefined && {
        is_preferred: dto.is_preferred,
      }),

      ...(dto.is_active !== undefined && {
        is_active: dto.is_active,
      }),

      updated_by: userId ?? null,
    });

    // ----------------------------------------------------------
    // ENSURE CONSISTENCY
    // ----------------------------------------------------------

    await this.ensurePreferredVendor(materialId, userId);

    return this.getMaterialVendor(materialVendorId);
  }

  // ============================================================
  // REMOVE VENDOR
  // ============================================================

  async removeVendor(
    materialId: string,
    materialVendorId: string,
    userId?: string,
  ): Promise<void> {
    const materialVendor = await this.materialVendorModel.findOne({
      where: {
        id: materialVendorId,
        material_id: materialId,
      },
    });

    if (!materialVendor) {
      throw new NotFoundException('Material vendor relationship not found');
    }

    const wasPreferred = materialVendor.is_preferred;

    await materialVendor.destroy();

    if (wasPreferred) {
      await this.ensurePreferredVendor(materialId, userId);
    }
  }

  // ============================================================
  // SET PREFERRED VENDOR
  // ============================================================

  async setPreferredVendor(
    materialId: string,
    materialVendorId: string,
    userId?: string,
  ): Promise<MaterialVendor> {
    const materialVendor = await this.materialVendorModel.findOne({
      where: {
        id: materialVendorId,
        material_id: materialId,
      },
    });

    if (!materialVendor) {
      throw new NotFoundException('Material vendor relationship not found');
    }

    if (!materialVendor.is_active) {
      throw new ConflictException(
        'An inactive vendor cannot be set as preferred',
      );
    }

    // ----------------------------------------------------------
    // REMOVE PREFERRED FROM ALL OTHERS
    // ----------------------------------------------------------

    await this.clearPreferredVendors(materialId, userId, materialVendorId);

    // ----------------------------------------------------------
    // SET SELECTED VENDOR
    // ----------------------------------------------------------

    await materialVendor.update({
      is_preferred: true,
      is_active: true,
      updated_by: userId ?? null,
    });

    return this.getMaterialVendor(materialVendorId);
  }

  // ============================================================
  // DEACTIVATE MATERIAL
  // ============================================================

  async deactivate(id: string, userId?: string): Promise<MaterialMaster> {
    const material = await this.findOne(id);

    await material.update({
      is_active: false,
      updated_by: userId ?? null,
    });

    return this.findOne(id);
  }

  // ============================================================
  // DEACTIVATE MATERIAL VENDOR
  // ============================================================

  async deactivateVendor(
    materialId: string,
    materialVendorId: string,
    userId?: string,
  ): Promise<MaterialVendor> {
    const materialVendor = await this.materialVendorModel.findOne({
      where: {
        id: materialVendorId,
        material_id: materialId,
      },
    });

    if (!materialVendor) {
      throw new NotFoundException('Material vendor relationship not found');
    }

    const wasPreferred = materialVendor.is_preferred;

    await materialVendor.update({
      is_active: false,
      is_preferred: false,
      updated_by: userId ?? null,
    });

    if (wasPreferred) {
      await this.ensurePreferredVendor(materialId, userId);
    }

    return this.getMaterialVendor(materialVendorId);
  }

  // ============================================================
  // ACTIVATE MATERIAL VENDOR
  // ============================================================

  async activateVendor(
    materialId: string,
    materialVendorId: string,
    userId?: string,
  ): Promise<MaterialVendor> {
    const materialVendor = await this.materialVendorModel.findOne({
      where: {
        id: materialVendorId,
        material_id: materialId,
      },
    });

    if (!materialVendor) {
      throw new NotFoundException('Material vendor relationship not found');
    }

    await materialVendor.update({
      is_active: true,
      updated_by: userId ?? null,
    });

    await this.ensurePreferredVendor(materialId, userId);

    return this.getMaterialVendor(materialVendorId);
  }

  // ============================================================
  // GET MATERIAL VENDOR RELATIONSHIP
  //
  // Used internally for vendor mutations.
  //
  // This intentionally returns MaterialVendor as root.
  // Material findAll/findOne NEVER use this method.
  // ============================================================

  private async getMaterialVendor(id: string): Promise<MaterialVendor> {
    const materialVendor = await this.materialVendorModel.findByPk(id, {
      include: [
        {
          model: Vendor,
          as: 'vendor',
          required: true,
        },
        {
          model: MaterialMaster,
          as: 'material',
          required: true,
        },
      ],
    });

    if (!materialVendor) {
      throw new NotFoundException('Material vendor relationship not found');
    }

    return materialVendor;
  }

  // ============================================================
  // CLEAR PREFERRED VENDORS
  // ============================================================

  private async clearPreferredVendors(
    materialId: string,
    userId?: string,
    exceptId?: string,
  ): Promise<void> {
    const where: any = {
      material_id: materialId,
      is_preferred: true,
    };

    if (exceptId) {
      where.id = {
        [Op.ne]: exceptId,
      };
    }

    await this.materialVendorModel.update(
      {
        is_preferred: false,
        updated_by: userId ?? null,
      },
      {
        where,
      },
    );
  }

  // ============================================================
  // ENSURE PREFERRED VENDOR
  // ============================================================
  //
  // Rules:
  //
  // 1. Only ACTIVE vendors can be preferred.
  // 2. Maximum one preferred vendor.
  // 3. If preferred vendor exists, keep it.
  // 4. If no preferred vendor exists, oldest active vendor
  //    becomes preferred.
  //
  // ============================================================

  private async ensurePreferredVendor(
    materialId: string,
    userId?: string,
  ): Promise<void> {
    // ----------------------------------------------------------
    // FIND ACTIVE PREFERRED
    // ----------------------------------------------------------

    const preferredVendor = await this.materialVendorModel.findOne({
      where: {
        material_id: materialId,
        is_active: true,
        is_preferred: true,
      },
      order: [['createdAt', 'ASC']],
    });

    // ----------------------------------------------------------
    // PREFERRED EXISTS
    // ----------------------------------------------------------

    if (preferredVendor) {
      // Make sure no second preferred exists.
      await this.materialVendorModel.update(
        {
          is_preferred: false,
          updated_by: userId ?? null,
        },
        {
          where: {
            material_id: materialId,
            is_preferred: true,
            id: {
              [Op.ne]: preferredVendor.id,
            },
          },
        },
      );

      return;
    }

    // ----------------------------------------------------------
    // NO PREFERRED VENDOR
    //
    // Promote oldest ACTIVE vendor.
    // ----------------------------------------------------------

    const nextVendor = await this.materialVendorModel.findOne({
      where: {
        material_id: materialId,
        is_active: true,
      },
      order: [['createdAt', 'ASC']],
    });

    if (!nextVendor) {
      return;
    }

    await nextVendor.update({
      is_preferred: true,
      updated_by: userId ?? null,
    });
  }

  // ============================================================
  // VALIDATE VENDOR
  // ============================================================

  private async validateVendor(vendorId: string): Promise<void> {
    const vendor = await this.vendorModel.findByPk(vendorId);

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Your vendors table uses `status`, not `is_active`.
    if (vendor.status !== 'active') {
      throw new ConflictException('Vendor is not active');
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
    if (price === null || price === undefined) {
      return;
    }

    if (typeof price !== 'number' || Number.isNaN(price)) {
      throw new ConflictException('Price must be a valid number');
    }

    if (price < 0) {
      throw new ConflictException('Price cannot be negative');
    }

    if (price > 9999999999999.99) {
      throw new ConflictException('Price exceeds the maximum allowed value');
    }
  }

  // ============================================================
  // VALIDATE DISCOUNT
  // ============================================================

  private validateDiscount(discount: number | null | undefined): void {
    if (discount === null || discount === undefined) {
      return;
    }

    if (typeof discount !== 'number' || Number.isNaN(discount)) {
      throw new ConflictException('Discount percent must be a valid number');
    }

    if (discount < 0 || discount > 100) {
      throw new ConflictException('Discount percent must be between 0 and 100');
    }
  }

  // ============================================================
  // VALIDATE LEAD TIME
  // ============================================================

  private validateLeadTime(leadTime: number | null | undefined): void {
    if (leadTime === null || leadTime === undefined) {
      return;
    }

    if (typeof leadTime !== 'number' || Number.isNaN(leadTime)) {
      throw new ConflictException('Lead time must be a valid number');
    }

    if (!Number.isInteger(leadTime)) {
      throw new ConflictException('Lead time must be a whole number of days');
    }

    if (leadTime < 0) {
      throw new ConflictException('Lead time cannot be negative');
    }
  }
}

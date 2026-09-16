import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { MaterialMasterService } from '../services/material-master.service';

import {
  AddMaterialVendorDto,
  CreateMaterialMasterDto,
  UpdateMaterialMasterDto,
  UpdateMaterialVendorDto,
} from '../dto/material-master.dto';

@Controller('materials')
export class MaterialMasterController {
  constructor(private readonly materialService: MaterialMasterService) {}

  // ============================================================
  // CREATE MATERIAL
  // ============================================================

  /**
   * POST /materials
   *
   * Creates only the Material Master.
   *
   * Vendor-specific information is managed separately through:
   * POST /materials/:id/vendors
   */
  @Post()
  create(@Body() dto: CreateMaterialMasterDto, @Req() req: any) {
    return this.materialService.create(dto, req.user?.id);
  }

  // ============================================================
  // FIND ALL MATERIALS
  // ============================================================

  /**
   * GET /materials
   *
   * Optional query params:
   *
   * ?search=plywood
   * ?category=Wood
   * ?vendor_id=<uuid>
   * ?unit_id=<uuid>
   * ?isActive=true
   */
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('vendor_id') vendorId?: string,
    @Query('unit_id') unitId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.materialService.findAll({
      search,
      category,
      vendor_id: vendorId,
      unit_id: unitId,
      is_active: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  // ============================================================
  // FIND ONE MATERIAL
  // ============================================================

  /**
   * GET /materials/:id
   *
   * Returns:
   *
   * Material
   * ├── Unit
   * └── Vendors
   *     └── Vendor
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialService.findOne(id);
  }

  // ============================================================
  // UPDATE MATERIAL
  // ============================================================

  /**
   * PATCH /materials/:id
   *
   * Updates Material Master fields only.
   *
   * Vendor fields such as price/vendor_id/etc.
   * must be updated using the vendor endpoints below.
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialMasterDto,
    @Req() req: any,
  ) {
    return this.materialService.update(id, dto, req.user?.id);
  }

  // ============================================================
  // DEACTIVATE MATERIAL
  // ============================================================

  /**
   * DELETE /materials/:id
   *
   * Soft-deactivates the material.
   */
  @Delete(':id')
  deactivate(@Param('id') id: string, @Req() req: any) {
    return this.materialService.deactivate(id, req.user?.id);
  }

  // ============================================================
  // ADD VENDOR TO MATERIAL
  // ============================================================

  /**
   * POST /materials/:id/vendors
   *
   * Example body:
   *
   * {
   *   "vendor_id": "uuid",
   *   "vendor_material_code": "ABC-001",
   *   "price": 2450,
   *   "discount_percent": 5,
   *   "lead_time_days": 7,
   *   "is_preferred": true,
   *   "is_active": true
   * }
   */
  @Post(':id/vendors')
  addVendor(
    @Param('id') materialId: string,
    @Body() dto: AddMaterialVendorDto,
    @Req() req: any,
  ) {
    return this.materialService.addVendor(materialId, dto, req.user?.id);
  }

  // ============================================================
  // UPDATE MATERIAL VENDOR
  // ============================================================

  /**
   * PATCH /materials/:id/vendors/:materialVendorId
   *
   * Example body:
   *
   * {
   *   "price": 2550,
   *   "discount_percent": 5,
   *   "lead_time_days": 7,
   *   "is_preferred": true,
   *   "is_active": true
   * }
   */
  @Patch(':id/vendors/:materialVendorId')
  updateVendor(
    @Param('id') materialId: string,
    @Param('materialVendorId') materialVendorId: string,
    @Body() dto: UpdateMaterialVendorDto,
    @Req() req: any,
  ) {
    return this.materialService.updateVendor(
      materialId,
      materialVendorId,
      dto,
      req.user?.id,
    );
  }

  // ============================================================
  // REMOVE VENDOR FROM MATERIAL
  // ============================================================

  /**
   * DELETE /materials/:id/vendors/:materialVendorId
   *
   * Permanently removes the material/vendor relationship.
   *
   * For historical ERP records, prefer:
   *
   * PATCH /materials/:id/vendors/:materialVendorId/deactivate
   */
  @Delete(':id/vendors/:materialVendorId')
  removeVendor(
    @Param('id') materialId: string,
    @Param('materialVendorId') materialVendorId: string,
    @Req() req: any,
  ) {
    return this.materialService.removeVendor(
      materialId,
      materialVendorId,
      req.user?.id,
    );
  }

  // ============================================================
  // SET PREFERRED VENDOR
  // ============================================================

  /**
   * PATCH /materials/:id/vendors/:materialVendorId/preferred
   *
   * Makes the selected active vendor the preferred vendor.
   *
   * Any other preferred vendor for this material
   * will automatically lose its preferred flag.
   */
  @Patch(':id/vendors/:materialVendorId/preferred')
  setPreferredVendor(
    @Param('id') materialId: string,
    @Param('materialVendorId') materialVendorId: string,
    @Req() req: any,
  ) {
    return this.materialService.setPreferredVendor(
      materialId,
      materialVendorId,
      req.user?.id,
    );
  }

  // ============================================================
  // DEACTIVATE MATERIAL VENDOR
  // ============================================================

  /**
   * PATCH /materials/:id/vendors/:materialVendorId/deactivate
   *
   * Soft-deactivates the vendor relationship.
   *
   * If this vendor was preferred, another active vendor
   * will automatically be promoted.
   */
  @Patch(':id/vendors/:materialVendorId/deactivate')
  deactivateVendor(
    @Param('id') materialId: string,
    @Param('materialVendorId') materialVendorId: string,
    @Req() req: any,
  ) {
    return this.materialService.deactivateVendor(
      materialId,
      materialVendorId,
      req.user?.id,
    );
  }

  // ============================================================
  // ACTIVATE MATERIAL VENDOR
  // ============================================================

  /**
   * PATCH /materials/:id/vendors/:materialVendorId/activate
   *
   * Re-activates an existing material/vendor relationship.
   *
   * If there is currently no preferred active vendor,
   * this vendor will be promoted automatically.
   */
  @Patch(':id/vendors/:materialVendorId/activate')
  activateVendor(
    @Param('id') materialId: string,
    @Param('materialVendorId') materialVendorId: string,
    @Req() req: any,
  ) {
    return this.materialService.activateVendor(
      materialId,
      materialVendorId,
      req.user?.id,
    );
  }
}

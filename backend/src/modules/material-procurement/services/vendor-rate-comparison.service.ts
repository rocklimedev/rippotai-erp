import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { VendorRateComparison } from '../models/vendor-rate-comparison.model';
import { Project } from '../../projects/models/projects.model';

import { SaveVendorRateComparisonDto } from '../dto/vendor-rate-comparison.dto';

@Injectable()
export class VendorRateComparisonService {
  constructor(
    @InjectModel(VendorRateComparison)
    private readonly sheets: typeof VendorRateComparison,
    @InjectModel(Project) private readonly projects: typeof Project,
  ) {}

  list(projectId?: string) {
    return this.sheets.findAll({
      where: projectId ? { project_id: projectId } : {},
      attributes: { exclude: ['snapshot'] },
      include: [{ model: Project, attributes: ['id', 'name'] }],
      order: [['updatedAt', 'DESC']],
    });
  }

  async get(id: string) {
    const sheet = await this.sheets.findByPk(id, {
      include: [{ model: Project, attributes: ['id', 'name'] }],
    });
    if (!sheet) throw new NotFoundException('Rate comparison sheet not found');
    return sheet;
  }

  async remove(id: string) {
    const sheet = await this.sheets.findByPk(id);
    if (!sheet) throw new NotFoundException('Rate comparison sheet not found');
    await sheet.destroy();
    return {
      success: true,
      message: 'Rate comparison sheet deleted successfully',
      id,
    };
  }

  private validateSnapshot(dto: SaveVendorRateComparisonDto) {
    const s = dto.snapshot;
    const object = (v: any) => v && typeof v === 'object' && !Array.isArray(v);
    const text = (v: any) => typeof v === 'string' && v.trim().length > 0;
    const numeric = (v: any) => typeof v === 'number' && Number.isFinite(v);
    if (!dto.title.trim())
      throw new BadRequestException('Sheet name is required');
    if (
      !object(s) ||
      s.schema_version !== 2 ||
      !Array.isArray(s.trades) ||
      !s.trades.length
    )
      throw new BadRequestException('Add at least one trade to the comparison');
    const tradeIds = new Set<string>();
    const tradeNames = new Set<string>();
    for (const trade of s.trades) {
      if (
        !object(trade) ||
        !text(trade.id) ||
        tradeIds.has(trade.id) ||
        !text(trade.name) ||
        !Array.isArray(trade.vendors) ||
        trade.vendors.length > 4
      )
        throw new BadRequestException('Invalid comparison trade');
      tradeIds.add(trade.id);
      const nameKey = trade.name
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*\(\d+\)$/, '')
        .toLowerCase();
      if (tradeNames.has(nameKey))
        throw new BadRequestException(
          'Trade names must be unique within a sheet',
        );
      tradeNames.add(nameKey);
      if (
        trade.vendor_column_count !== undefined &&
        (!Number.isInteger(trade.vendor_column_count) ||
          trade.vendor_column_count < 1 ||
          trade.vendor_column_count > 4)
      )
        throw new BadRequestException('Compare between one and four vendors');
      const sharedItems = new Map<string, any>();
      if (trade.items !== undefined) {
        if (!Array.isArray(trade.items))
          throw new BadRequestException('Invalid shared comparison items');
        for (const item of trade.items) {
          if (
            !object(item) ||
            !text(item.id) ||
            sharedItems.has(item.id) ||
            !text(item.description) ||
            !(
              item.quantity === null ||
              (numeric(item.quantity) && item.quantity >= 0)
            )
          )
            throw new BadRequestException(
              'Shared items need unique IDs, descriptions and non-negative quantities',
            );
          sharedItems.set(item.id, item);
        }
      }
      const vendorIds = new Set<string>();
      for (const vendor of trade.vendors) {
        if (
          !object(vendor) ||
          !text(vendor.id) ||
          vendorIds.has(vendor.id) ||
          !text(vendor.name) ||
          !Array.isArray(vendor.items) ||
          (vendor.notes !== undefined &&
            (typeof vendor.notes !== 'string' || vendor.notes.length > 10000))
        )
          throw new BadRequestException('Invalid trade vendor');
        vendorIds.add(vendor.id);
        if (
          trade.items !== undefined &&
          vendor.items.length !== sharedItems.size
        )
          throw new BadRequestException(
            'Vendor quotes must use the shared comparison items',
          );
        const itemIds = new Set<string>();
        for (const item of vendor.items) {
          if (
            !object(item) ||
            !text(item.id) ||
            itemIds.has(item.id) ||
            !text(item.description) ||
            !(
              item.quantity === null ||
              (numeric(item.quantity) && item.quantity >= 0)
            ) ||
            !(item.rate === null || numeric(item.rate)) ||
            (item.rate === null && trade.finalised_vendor_id === vendor.id)
          )
            throw new BadRequestException(
              'Quote lines need a description, non-negative quantity and a valid rate; finalised quotes must be complete',
            );
          itemIds.add(item.id);
          if (trade.items !== undefined) {
            const shared = sharedItems.get(item.id);
            if (
              !shared ||
              shared.description !== item.description ||
              shared.quantity !== item.quantity
            )
              throw new BadRequestException(
                'Vendor descriptions and quantities must match the shared item',
              );
          }
          if (
            item.rate !== null &&
            !Number.isFinite((item.quantity ?? 1) * item.rate)
          )
            throw new BadRequestException('Quote amount is too large');
        }
        const total = vendor.items.reduce(
          (sum, item) => sum + (item.quantity ?? 1) * (item.rate ?? 0),
          0,
        );
        if (!Number.isFinite(total))
          throw new BadRequestException('Quote total is too large');
      }
      if (
        trade.finalised_vendor_id &&
        (!vendorIds.has(trade.finalised_vendor_id) ||
          !trade.vendors.find((v) => v.id === trade.finalised_vendor_id)?.items
            .length)
      )
        throw new BadRequestException(
          'Finalised vendor must have a quote in this trade',
        );
    }
    if (Buffer.byteLength(JSON.stringify(s)) > 2 * 1024 * 1024)
      throw new BadRequestException('Comparison snapshot is too large');
  }
  async create(dto: SaveVendorRateComparisonDto, userId: string) {
    this.validateSnapshot(dto);
    // Serialize creates on the project row, including when two users save
    // their first comparison at the same time. Historical sheets stay intact.
    return this.sheets.sequelize!.transaction(async (transaction) => {
      const project = await this.projects.findByPk(dto.project_id, {
        transaction,
        lock: Transaction.LOCK.UPDATE,
      });
      if (!project) throw new BadRequestException('Project not found');
      const existing = await this.sheets.findOne({
        where: { project_id: dto.project_id },
        order: [
          ['updatedAt', 'DESC'],
          ['id', 'ASC'],
        ],
        attributes: ['id'],
        transaction,
      });
      if (existing)
        throw new ConflictException({
          message:
            'This project already has a vendor comparison. Open the existing sheet.',
          comparison_id: existing.id,
        });
      return this.sheets.create(
        {
          title: dto.title.trim(),
          project_id: dto.project_id,
          boq_id: null,
          notes: dto.notes || null,
          snapshot: dto.snapshot,
          revision: 1,
          created_by: userId,
        },
        { transaction },
      );
    });
  }

  async update(id: string, dto: SaveVendorRateComparisonDto) {
    this.validateSnapshot(dto);
    const sheet = await this.get(id);
    if (dto.project_id !== sheet.project_id)
      throw new BadRequestException('A saved sheet keeps its original project');
    if (dto.title.trim() !== sheet.title)
      throw new BadRequestException(
        'A saved vendor comparison cannot be renamed',
      );
    if (dto.revision !== sheet.revision)
      throw new ConflictException(
        'This sheet was updated elsewhere. Reload it before saving.',
      );
    const [count] = await this.sheets.update(
      {
        notes: dto.notes || null,
        snapshot: dto.snapshot,
        revision: sheet.revision + 1,
      },
      { where: { id, revision: dto.revision } },
    );
    if (!count)
      throw new ConflictException(
        'This sheet was updated elsewhere. Reload it before saving.',
      );
    return this.get(id);
  }
}

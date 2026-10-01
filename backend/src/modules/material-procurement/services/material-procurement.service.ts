import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Sequelize } from 'sequelize-typescript';

import {
  MaterialProcurement,
  MaterialProcurementStatus,
} from '../models/material-procurement.model';

import { MaterialProcurementItem } from '../models/material-procurement-item.model';

import {
  CreateMaterialProcurementDto,
  CreateMaterialProcurementItemDto,
} from '../dto/create-material-procurement.dto';

import { UpdateMaterialProcurementDto } from '../dto/update-material-procurement.dto';

import { MaterialMaster } from '../models/material-master.model';
import { Unit } from '@/modules/metas/models/unit.model';

@Injectable()
export class MaterialProcurementService {
  constructor(
    @InjectModel(MaterialProcurement)
    private readonly procurementModel: typeof MaterialProcurement,

    @InjectModel(MaterialProcurementItem)
    private readonly itemModel: typeof MaterialProcurementItem,

    private readonly sequelize: Sequelize,
  ) {}

  // ============================================================
  // CREATE
  // ============================================================

  async create(dto: CreateMaterialProcurementDto, userId?: string) {
    return this.sequelize.transaction(async (transaction) => {
      const procurementNo = await this.generateProcurementNo();

      const procurement = await this.procurementModel.create(
        {
          projectId: dto.projectId,
          procurementNo,
          status: dto.status ?? MaterialProcurementStatus.DRAFT,
          remarks: dto.remarks ?? null,
          createdById: userId ?? null,
        },
        {
          transaction,
        },
      );

      if (dto.items?.length) {
        const items = dto.items.map((item) =>
          this.prepareItem(item, procurement.id),
        );

        await this.itemModel.bulkCreate(items, {
          transaction,
        });
      }

      return this.findOne(procurement.id, transaction);
    });
  }

  // ============================================================
  // FIND ALL
  // ============================================================

  async findAll(projectId?: string) {
    const where: Record<string, unknown> = {};

    if (projectId) {
      where.projectId = projectId;
    }

    return this.procurementModel.findAll({
      where,

      include: [
        {
          model: MaterialProcurementItem,
          as: 'items',
          required: false,

          include: [
            {
              model: MaterialMaster,
              as: 'materialMaster',
              required: false,

              include: [
                {
                  model: Unit,
                  as: 'unit',
                  required: false,
                },
              ],
            },
          ],

          separate: true,
          order: [['serialNo', 'ASC']],
        },
      ],

      order: [['createdAt', 'DESC']],
    });
  }
  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string, transaction?: any) {
    const procurement = await this.procurementModel.findByPk(id, {
      include: [
        {
          model: MaterialProcurementItem,
          as: 'items',
          required: false,

          include: [
            {
              model: MaterialMaster,
              as: 'materialMaster',
              required: false,

              include: [
                {
                  model: Unit,
                  as: 'unit',
                  required: false,
                },
              ],
            },
          ],

          separate: true,
          order: [['serialNo', 'ASC']],
        },
      ],

      transaction,
    });

    if (!procurement) {
      throw new NotFoundException(`Material procurement ${id} not found`);
    }

    return procurement;
  }

  // ============================================================
  // UPDATE
  // ============================================================

  async update(id: string, dto: UpdateMaterialProcurementDto) {
    return this.sequelize.transaction(async (transaction) => {
      const procurement = await this.procurementModel.findByPk(id, {
        transaction,
      });

      if (!procurement) {
        throw new NotFoundException(`Material procurement ${id} not found`);
      }

      const { items, projectId, ...headerData } = dto;

      await procurement.update(
        {
          ...headerData,

          ...(projectId !== undefined
            ? {
                projectId,
              }
            : {}),
        },
        {
          transaction,
        },
      );

      // ----------------------------------------------------------
      // REPLACE ITEMS
      // ----------------------------------------------------------

      if (items !== undefined) {
        await this.itemModel.destroy({
          where: {
            procurementId: procurement.id,
          },
          transaction,
        });

        if (items.length) {
          await this.itemModel.bulkCreate(
            items.map((item) => this.prepareItem(item, procurement.id)),
            {
              transaction,
            },
          );
        }
      }

      return this.findOne(procurement.id, transaction);
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  async remove(id: string) {
    const procurement = await this.procurementModel.findByPk(id);

    if (!procurement) {
      throw new NotFoundException(`Material procurement ${id} not found`);
    }

    await procurement.destroy();

    return {
      success: true,
      message: 'Material procurement deleted successfully',
    };
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  async submit(id: string) {
    const procurement = await this.procurementModel.findByPk(id);

    if (!procurement) {
      throw new NotFoundException(`Material procurement ${id} not found`);
    }

    await procurement.update({
      status: MaterialProcurementStatus.SUBMITTED,
    });

    return this.findOne(id);
  }

  // ============================================================
  // PREPARE ITEM
  // ============================================================

  private prepareItem(
    item: CreateMaterialProcurementItemDto,
    procurementId: string,
  ) {
    const totalArea = item.totalArea ?? this.calculateTotalArea(item);

    const amount =
      item.amount ?? Number(item.quantity || 0) * Number(item.price || 0);

    return {
      procurementId,

      serialNo: item.serialNo,

      // --------------------------------------------------------
      // MATERIAL MASTER
      // --------------------------------------------------------

      materialId: item.materialId,

      // --------------------------------------------------------
      // LOCATION / AREA
      // --------------------------------------------------------

      area: item.area ?? null,

      location: item.location ?? null,

      // --------------------------------------------------------
      // MEASUREMENTS
      // --------------------------------------------------------

      wallArea: item.wallArea ?? null,

      floorArea: item.floorArea ?? null,

      ceilingArea: item.ceilingArea ?? null,

      totalArea,

      // --------------------------------------------------------
      // QUANTITY / PRICE
      // --------------------------------------------------------

      quantity: item.quantity ?? 0,

      price: item.price ?? 0,

      amount,
    };
  }

  // ============================================================
  // CALCULATE TOTAL AREA
  // ============================================================

  private calculateTotalArea(item: CreateMaterialProcurementItemDto) {
    return (
      Number(item.wallArea || 0) +
      Number(item.floorArea || 0) +
      Number(item.ceilingArea || 0)
    );
  }

  // ============================================================
  // GENERATE PROCUREMENT NUMBER
  // ============================================================

  private async generateProcurementNo() {
    const prefix = 'MP';

    const last = await this.procurementModel.findOne({
      order: [['createdAt', 'DESC']],
      attributes: ['procurementNo'],
    });

    let nextNumber = 1;

    if (last?.procurementNo) {
      const match = last.procurementNo.match(/(\d+)$/);

      if (match) {
        nextNumber = Number(match[1]) + 1;
      }
    }

    return `${prefix}-${String(nextNumber).padStart(5, '0')}`;
  }
}

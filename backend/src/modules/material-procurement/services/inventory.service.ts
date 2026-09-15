import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import { Op, WhereOptions } from 'sequelize';
import {
  InventoryDirection,
  InventoryTransaction,
  InventoryTransactionType,
} from '../models/inventory-transaction.model';
import { InventoryConditionStatus } from '../models/inventory-transaction.model';
import { MaterialMaster } from '../models/material-master.model';

import {
  CreateInventoryTransactionDto,
  IssueMaterialDto,
} from '../dto/inventory.dto';
import { InventoryReferenceType } from '../models/inventory-transaction.model';
@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryTransaction)
    private readonly inventoryModel: typeof InventoryTransaction,

    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,
  ) {}

  private getDirection(type: InventoryTransactionType): InventoryDirection {
    switch (type) {
      case InventoryTransactionType.RECEIPT:
      case InventoryTransactionType.RETURN_FROM_CONTRACTOR:
      case InventoryTransactionType.TRANSFER_IN:
      case InventoryTransactionType.ADJUSTMENT_IN:
        return InventoryDirection.IN;

      case InventoryTransactionType.ISSUE:
      case InventoryTransactionType.RETURN_TO_VENDOR:
      case InventoryTransactionType.TRANSFER_OUT:
      case InventoryTransactionType.ADJUSTMENT_OUT:
        return InventoryDirection.OUT;

      default:
        throw new BadRequestException('Invalid inventory transaction type');
    }
  }

  async create(dto: CreateInventoryTransactionDto, userId?: string) {
    const material = await this.materialModel.findByPk(dto.material_id);

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (!material.is_active) {
      throw new BadRequestException('Material is inactive');
    }

    const direction = this.getDirection(dto.transaction_type);

    if (direction === InventoryDirection.OUT) {
      const available = await this.getCurrentStock(
        dto.project_id,
        dto.site_id,
        dto.material_id,
      );

      if (Number(dto.quantity) > Number(available)) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${available} ${
            dto.unit ?? material.default_unit
          }`,
        );
      }
    }

    return this.inventoryModel.create({
      ...dto,

      site_id: dto.site_id ?? null,

      unit: dto.unit ?? material.default_unit,

      direction,

      reference_type: dto.reference_type ?? null,

      reference_id: dto.reference_id ?? null,

      reference_item_id: dto.reference_item_id ?? null,

      vendor_id: dto.vendor_id ?? null,

      contractor_id: dto.contractor_id ?? null,

      trade: dto.trade ?? null,

      work_reference: dto.work_reference ?? null,

      storage_location: dto.storage_location ?? null,

      condition_status:
        dto.condition_status ?? InventoryConditionStatus.NOT_APPLICABLE,

      condition_notes: dto.condition_notes ?? null,

      issued_to: dto.issued_to ?? null,

      issued_by: dto.issued_by ?? null,

      received_by: dto.received_by ?? null,

      remarks: dto.remarks ?? null,

      created_by: userId ?? null,
    });
  }

  async issue(dto: IssueMaterialDto, userId?: string) {
    return this.create(
      {
        ...dto,

        transaction_type: InventoryTransactionType.ISSUE,

        reference_type: InventoryReferenceType.ISSUE,
      },
      userId,
    );
  }

  async receiveFromDelivery(
    params: {
      project_id: string;
      site_id?: string;
      material_id: string;
      quantity: number;
      unit: string;
      delivery_challan_id: string;
      delivery_challan_item_id: string;
      vendor_id?: string;
      storage_location?: string;
      condition_status?: any;
      condition_notes?: string;
      received_by?: string;
      transaction_date: string;
      remarks?: string;
    },
    userId?: string,
  ) {
    return this.create(
      {
        project_id: params.project_id,

        site_id: params.site_id,

        material_id: params.material_id,

        transaction_date: params.transaction_date,

        transaction_type: InventoryTransactionType.RECEIPT,

        quantity: params.quantity,

        unit: params.unit,

        reference_type: InventoryReferenceType.DELIVERY_CHALLAN,

        reference_id: params.delivery_challan_id,

        reference_item_id: params.delivery_challan_item_id,

        vendor_id: params.vendor_id,

        storage_location: params.storage_location,

        condition_status: params.condition_status,

        condition_notes: params.condition_notes,

        received_by: params.received_by,

        remarks: params.remarks,
      },
      userId,
    );
  }

  async findAll(params?: {
    projectId?: string;
    siteId?: string;
    materialId?: string;
    transactionType?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (params?.projectId) {
      where.project_id = params.projectId;
    }

    if (params?.siteId) {
      where.site_id = params.siteId;
    }

    if (params?.materialId) {
      where.material_id = params.materialId;
    }

    if (params?.transactionType) {
      where.transaction_type = params.transactionType;
    }

    if (params?.fromDate || params?.toDate) {
      where.transaction_date = {};

      if (params.fromDate) {
        where.transaction_date[Op.gte] = params.fromDate;
      }

      if (params.toDate) {
        where.transaction_date[Op.lte] = params.toDate;
      }
    }

    return this.inventoryModel.findAll({
      where,
      include: [
        {
          model: MaterialMaster,
        },
      ],
      order: [
        ['transaction_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  async findOne(id: string) {
    const transaction = await this.inventoryModel.findByPk(id, {
      include: [MaterialMaster],
    });

    if (!transaction) {
      throw new NotFoundException('Inventory transaction not found');
    }

    return transaction;
  }

  async getCurrentStock(
    projectId: string,
    siteId: string | undefined,
    materialId: string,
  ): Promise<number> {
    const where: any = {
      project_id: projectId,
      material_id: materialId,
    };

    if (siteId) {
      where.site_id = siteId;
    }

    const transactions = await this.inventoryModel.findAll({
      where,
      attributes: ['direction', 'quantity'],
    });

    let balance = 0;

    for (const transaction of transactions) {
      const quantity = Number(transaction.quantity);

      if (transaction.direction === InventoryDirection.IN) {
        balance += quantity;
      } else {
        balance -= quantity;
      }
    }

    return balance;
  }

  async getProjectStock(projectId: string, siteId?: string) {
    const where: WhereOptions<InventoryTransaction> = {
      project_id: projectId,
    };

    if (siteId) {
      where.site_id = siteId;
    }

    const transactions = await this.inventoryModel.findAll({
      where,
      include: [
        {
          model: MaterialMaster,
          required: true,
        },
      ],
      order: [
        ['transaction_date', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    const balances = new Map<
      string,
      {
        material: MaterialMaster;
        unit: string;
        quantity: number;
      }
    >();

    for (const transaction of transactions) {
      const material = transaction.material;

      /**
       * Because this is a required association, a transaction without
       * its MaterialMaster should never normally reach this point.
       *
       * Still guard it so the service remains safe if the association
       * is ever changed or data becomes inconsistent.
       */
      if (!material) {
        continue;
      }

      const key = transaction.material_id;

      if (!balances.has(key)) {
        balances.set(key, {
          material,
          unit: transaction.unit,
          quantity: 0,
        });
      }

      const entry = balances.get(key)!;

      const quantity = Number(transaction.quantity);

      if (transaction.direction === InventoryDirection.IN) {
        entry.quantity += quantity;
      } else {
        entry.quantity -= quantity;
      }
    }

    return Array.from(balances.values());
  }
}

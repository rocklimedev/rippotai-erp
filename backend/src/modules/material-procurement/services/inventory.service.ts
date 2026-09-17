import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';

import {
  Op,
  Transaction as SequelizeTransaction,
  WhereOptions,
} from 'sequelize';

import {
  InventoryDirection,
  InventoryTransaction,
  InventoryTransactionType,
  InventoryConditionStatus,
  InventoryReferenceType,
} from '../models/inventory-transaction.model';

import { MaterialMaster } from '../models/material-master.model';

import {
  CreateInventoryTransactionDto,
  IssueMaterialDto,
  AdjustInventoryDto,
  TransferInventoryDto,
  ReturnInventoryDto,
} from '../dto/inventory.dto';

import { Unit } from '@/modules/metas/models/unit.model';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryTransaction)
    private readonly inventoryModel: typeof InventoryTransaction,

    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,

    @InjectModel(Unit)
    private readonly unitModel: typeof Unit,
  ) {}

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /**
   * Determines whether a transaction increases or decreases stock.
   */
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

  /**
   * Validates quantity.
   */
  private validateQuantity(quantity: number | string) {
    const value = Number(quantity);

    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    return value;
  }

  /**
   * Validate material and load its configured unit.
   */
  private async getValidMaterial(materialId: string): Promise<MaterialMaster> {
    if (!materialId) {
      throw new BadRequestException('Material is required');
    }

    const material = await this.materialModel.findByPk(materialId, {
      include: [
        {
          model: Unit,
          as: 'unit',
          required: true,
        },
      ],
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    if (!material.is_active) {
      throw new BadRequestException('Material is inactive');
    }

    if (!material.unit_id) {
      throw new BadRequestException('Material does not have a unit configured');
    }

    if (!material.unit) {
      throw new BadRequestException('Material unit could not be loaded');
    }

    return material;
  }

  /**
   * Validate stock for an OUT transaction.
   */
  private async validateAvailableStock(
    projectId: string,
    siteId: string | undefined,
    materialId: string,
    quantity: number,
  ) {
    const available = await this.getCurrentStock(projectId, siteId, materialId);

    if (quantity > available) {
      const material = await this.getValidMaterial(materialId);

      throw new BadRequestException(
        `Insufficient stock. Available: ${available} ${
          material.unit?.code ?? ''
        }`,
      );
    }

    return available;
  }

  /**
   * Common includes used by inventory queries.
   */
  private getInventoryIncludes() {
    return [
      {
        model: MaterialMaster,
        required: true,

        include: [
          {
            model: Unit,
            as: 'unit',
            required: true,
          },
        ],
      },

      {
        model: Unit,
        as: 'unit',
        required: true,
      },
    ];
  }

  // ============================================================
  // CREATE TRANSACTION
  // ============================================================

  /**
   * Generic inventory transaction creator.
   *
   * This remains the central method used by:
   *
   * RECEIPT
   * ISSUE
   * ADJUSTMENT_IN
   * ADJUSTMENT_OUT
   * RETURN_FROM_CONTRACTOR
   * RETURN_TO_VENDOR
   * TRANSFER_IN
   * TRANSFER_OUT
   */
  async create(
    dto: CreateInventoryTransactionDto,
    userId?: string,
    dbTransaction?: SequelizeTransaction,
  ) {
    const material = await this.getValidMaterial(dto.material_id);

    const quantity = this.validateQuantity(dto.quantity);

    const direction = this.getDirection(dto.transaction_type);

    // ----------------------------------------------------------
    // Validate stock for OUT transactions
    // ----------------------------------------------------------

    if (direction === InventoryDirection.OUT) {
      await this.validateAvailableStock(
        dto.project_id,
        dto.site_id,
        dto.material_id,
        quantity,
      );
    }

    // ----------------------------------------------------------
    // Create transaction
    // ----------------------------------------------------------

    const transaction = await this.inventoryModel.create(
      {
        ...dto,

        quantity,

        site_id: dto.site_id ?? null,

        /**
         * ALWAYS derive unit from MaterialMaster.
         *
         * Never trust a frontend supplied unit_id.
         */
        unit_id: material.unit_id,

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
      },
      {
        transaction: dbTransaction,
      },
    );

    return this.findOne(transaction.id);
  }

  // ============================================================
  // ADD / RECEIVE INVENTORY
  // ============================================================

  /**
   * General purpose inventory receipt.
   *
   * Used when material enters project inventory without
   * necessarily coming through a Delivery Challan.
   */
  async receive(dto: CreateInventoryTransactionDto, userId?: string) {
    return this.create(
      {
        ...dto,

        transaction_type: InventoryTransactionType.RECEIPT,

        reference_type: dto.reference_type ?? InventoryReferenceType.MANUAL,
      },
      userId,
    );
  }

  // ============================================================
  // ISSUE MATERIAL
  // ============================================================

  async issue(dto: IssueMaterialDto, userId?: string) {
    const quantity = this.validateQuantity(dto.quantity);

    await this.validateAvailableStock(
      dto.project_id,
      dto.site_id,
      dto.material_id,
      quantity,
    );

    return this.create(
      {
        ...dto,

        quantity,

        transaction_type: InventoryTransactionType.ISSUE,

        reference_type: InventoryReferenceType.ISSUE,
      },
      userId,
    );
  }

  // ============================================================
  // ADJUST INVENTORY
  // ============================================================

  /**
   * Add or remove physical stock after stock counting,
   * opening stock entry, correction, etc.
   */
  async adjust(dto: AdjustInventoryDto, userId?: string) {
    const quantity = this.validateQuantity(dto.quantity);

    const direction = dto.direction;

    if (
      direction !== InventoryDirection.IN &&
      direction !== InventoryDirection.OUT
    ) {
      throw new BadRequestException('Adjustment direction must be IN or OUT');
    }

    if (direction === InventoryDirection.OUT) {
      await this.validateAvailableStock(
        dto.project_id,
        dto.site_id,
        dto.material_id,
        quantity,
      );
    }

    const transactionType =
      direction === InventoryDirection.IN
        ? InventoryTransactionType.ADJUSTMENT_IN
        : InventoryTransactionType.ADJUSTMENT_OUT;

    return this.create(
      {
        ...dto,

        quantity,

        transaction_type: transactionType,

        reference_type: InventoryReferenceType.ADJUSTMENT,

        remarks: dto.reason ?? dto.remarks ?? 'Inventory adjustment',
      },
      userId,
    );
  }

  // ============================================================
  // OPENING STOCK
  // ============================================================

  /**
   * Opening inventory is represented as an adjustment IN.
   *
   * This avoids creating a second stock source/table.
   */
  async addOpeningStock(dto: AdjustInventoryDto, userId?: string) {
    const quantity = this.validateQuantity(dto.quantity);

    return this.create(
      {
        ...dto,

        quantity,

        transaction_type: InventoryTransactionType.ADJUSTMENT_IN,

        reference_type: InventoryReferenceType.ADJUSTMENT,

        remarks: dto.reason ?? dto.remarks ?? 'Opening stock',
      },
      userId,
    );
  }

  // ============================================================
  // TRANSFER INVENTORY
  // ============================================================

  /**
   * Transfers material from one site to another.
   *
   * Creates:
   *
   * TRANSFER_OUT from source
   * TRANSFER_IN to destination
   *
   * Both transactions use the same reference_id.
   */
  async transfer(dto: TransferInventoryDto, userId?: string) {
    if (!dto.from_site_id || !dto.to_site_id) {
      throw new BadRequestException(
        'Both source and destination sites are required',
      );
    }

    if (dto.from_site_id === dto.to_site_id) {
      throw new BadRequestException(
        'Source and destination sites must be different',
      );
    }

    const quantity = this.validateQuantity(dto.quantity);

    const material = await this.getValidMaterial(dto.material_id);

    await this.validateAvailableStock(
      dto.project_id,
      dto.from_site_id,
      dto.material_id,
      quantity,
    );

    const sequelize = this.inventoryModel.sequelize;

    if (!sequelize) {
      throw new BadRequestException(
        'Inventory database connection unavailable',
      );
    }

    return sequelize.transaction(async (transaction) => {
      const transferId =
        dto.reference_id ??
        `TRANSFER-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`;

      // --------------------------------------------------------
      // TRANSFER OUT
      // --------------------------------------------------------

      const transferOut = await this.inventoryModel.create(
        {
          project_id: dto.project_id,

          site_id: dto.from_site_id,

          material_id: dto.material_id,

          transaction_date: dto.transaction_date ?? new Date().toISOString(),

          transaction_type: InventoryTransactionType.TRANSFER_OUT,

          quantity,

          unit_id: material.unit_id,

          direction: InventoryDirection.OUT,

          reference_type: InventoryReferenceType.TRANSFER,

          reference_id: transferId,

          reference_item_id: dto.reference_item_id ?? null,

          vendor_id: null,

          contractor_id: null,

          trade: null,

          work_reference: dto.work_reference ?? null,

          storage_location: dto.from_storage_location ?? null,

          condition_status: InventoryConditionStatus.NOT_APPLICABLE,

          condition_notes: null,

          issued_to: null,

          issued_by: dto.issued_by ?? userId ?? null,

          received_by: null,

          remarks: dto.remarks ?? 'Inventory transfer',

          created_by: userId ?? null,
        },
        {
          transaction,
        },
      );

      // --------------------------------------------------------
      // TRANSFER IN
      // --------------------------------------------------------

      const transferIn = await this.inventoryModel.create(
        {
          project_id: dto.project_id,

          site_id: dto.to_site_id,

          material_id: dto.material_id,

          transaction_date: dto.transaction_date ?? new Date().toISOString(),

          transaction_type: InventoryTransactionType.TRANSFER_IN,

          quantity,

          unit_id: material.unit_id,

          direction: InventoryDirection.IN,

          reference_type: InventoryReferenceType.TRANSFER,

          reference_id: transferId,

          reference_item_id: dto.reference_item_id ?? null,

          vendor_id: null,

          contractor_id: null,

          trade: null,

          work_reference: dto.work_reference ?? null,

          storage_location: dto.to_storage_location ?? null,

          condition_status: InventoryConditionStatus.NOT_APPLICABLE,

          condition_notes: null,

          issued_to: null,

          issued_by: null,

          received_by: dto.received_by ?? userId ?? null,

          remarks: dto.remarks ?? 'Inventory transfer',

          created_by: userId ?? null,
        },
        {
          transaction,
        },
      );

      return {
        transfer_id: transferId,

        quantity,

        unit: material.unit,

        from_site_id: dto.from_site_id,

        to_site_id: dto.to_site_id,

        transfer_out: transferOut,

        transfer_in: transferIn,
      };
    });
  }

  // ============================================================
  // RETURNS
  // ============================================================

  /**
   * Return material from contractor or to vendor.
   *
   * RETURN_FROM_CONTRACTOR:
   *   increases project inventory.
   *
   * RETURN_TO_VENDOR:
   *   decreases project inventory.
   */
  async returnMaterial(dto: ReturnInventoryDto, userId?: string) {
    const quantity = this.validateQuantity(dto.quantity);

    if (
      dto.return_type !== InventoryTransactionType.RETURN_FROM_CONTRACTOR &&
      dto.return_type !== InventoryTransactionType.RETURN_TO_VENDOR
    ) {
      throw new BadRequestException('Invalid return type');
    }

    if (dto.return_type === InventoryTransactionType.RETURN_TO_VENDOR) {
      await this.validateAvailableStock(
        dto.project_id,
        dto.site_id,
        dto.material_id,
        quantity,
      );
    }

    return this.create(
      {
        ...dto,

        quantity,

        transaction_type: dto.return_type,

        reference_type: dto.reference_type ?? InventoryReferenceType.RETURN,
      },
      userId,
    );
  }

  // ============================================================
  // RECEIVE FROM DELIVERY CHALLAN
  // ============================================================

  /**
   * Receives accepted material from a Delivery Challan.
   *
   * IMPORTANT:
   * Existing receipts linked to the same DC item are checked
   * before creating another receipt.
   */
  async receiveFromDelivery(
    params: {
      project_id: string;

      site_id?: string;

      material_id: string;

      quantity: number;

      delivery_challan_id: string;

      delivery_challan_item_id: string;

      vendor_id?: string;

      storage_location?: string;

      condition_status?: InventoryConditionStatus;

      condition_notes?: string;

      received_by?: string;

      transaction_date: string;

      remarks?: string;

      /**
       * Optional accepted quantity supplied by the
       * Delivery Challan service.
       *
       * If not provided, only duplicate-reference
       * protection can be performed here.
       */
      accepted_quantity?: number;
    },
    userId?: string,
  ) {
    const quantity = this.validateQuantity(params.quantity);

    await this.getValidMaterial(params.material_id);

    // ----------------------------------------------------------
    // Check existing receipt transactions
    // ----------------------------------------------------------

    const existingReceipts = await this.inventoryModel.findAll({
      where: {
        reference_type: InventoryReferenceType.DELIVERY_CHALLAN,

        reference_id: params.delivery_challan_id,

        reference_item_id: params.delivery_challan_item_id,

        transaction_type: InventoryTransactionType.RECEIPT,
      },

      attributes: ['id', 'quantity', 'transaction_date'],
    });

    const alreadyReceived = existingReceipts.reduce(
      (sum, item) => sum + Number(item.quantity),
      0,
    );

    // ----------------------------------------------------------
    // If accepted quantity is known, enforce it
    // ----------------------------------------------------------

    if (params.accepted_quantity !== undefined) {
      const acceptedQuantity = this.validateQuantity(params.accepted_quantity);

      const remaining = acceptedQuantity - alreadyReceived;

      if (remaining <= 0) {
        throw new BadRequestException(
          'This Delivery Challan item has already been fully received into inventory',
        );
      }

      if (quantity > remaining) {
        throw new BadRequestException(
          `Cannot receive ${quantity}. Only ${remaining} remains receivable for this Delivery Challan item.`,
        );
      }
    } else {
      /**
       * Without accepted_quantity we cannot know whether
       * the DC item is partially accepted.
       *
       * The reference check still prevents accidental
       * duplicate receipts only when the exact quantity
       * has already been received.
       */
      const duplicateSameQuantity = existingReceipts.some(
        (item) => Number(item.quantity) === quantity,
      );

      if (duplicateSameQuantity) {
        throw new BadRequestException(
          'This Delivery Challan item has already been received with the same quantity',
        );
      }
    }

    return this.create(
      {
        project_id: params.project_id,

        site_id: params.site_id,

        material_id: params.material_id,

        transaction_date: params.transaction_date,

        transaction_type: InventoryTransactionType.RECEIPT,

        quantity,

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

  // ============================================================
  // FIND ALL TRANSACTIONS
  // ============================================================

  async findAll(params?: {
    projectId?: string;

    siteId?: string;

    materialId?: string;

    transactionType?: string;

    referenceType?: string;

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

    if (params?.referenceType) {
      where.reference_type = params.referenceType;
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

      include: this.getInventoryIncludes(),

      order: [
        ['transaction_date', 'DESC'],

        ['created_at', 'DESC'],
      ],
    });
  }

  // ============================================================
  // FIND ONE
  // ============================================================

  async findOne(id: string) {
    const transaction = await this.inventoryModel.findByPk(id, {
      include: this.getInventoryIncludes(),
    });

    if (!transaction) {
      throw new NotFoundException('Inventory transaction not found');
    }

    return transaction;
  }

  // ============================================================
  // CURRENT STOCK
  // ============================================================

  /**
   * Returns current stock for:
   *
   * project + material
   *
   * optionally:
   *
   * project + site + material
   */
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
      } else if (transaction.direction === InventoryDirection.OUT) {
        balance -= quantity;
      }
    }

    return balance;
  }

  // ============================================================
  // MATERIAL HISTORY
  // ============================================================

  async getMaterialHistory(
    projectId: string,
    materialId: string,
    siteId?: string,
  ) {
    const where: any = {
      project_id: projectId,

      material_id: materialId,
    };

    if (siteId) {
      where.site_id = siteId;
    }

    return this.inventoryModel.findAll({
      where,

      include: this.getInventoryIncludes(),

      order: [
        ['transaction_date', 'DESC'],

        ['created_at', 'DESC'],
      ],
    });
  }

  // ============================================================
  // PROJECT STOCK
  // ============================================================

  async getProjectStock(projectId: string, siteId?: string) {
    const where: WhereOptions<InventoryTransaction> = {
      project_id: projectId,
    };

    if (siteId) {
      where.site_id = siteId;
    }

    const transactions = await this.inventoryModel.findAll({
      where,

      include: this.getInventoryIncludes(),

      order: [
        ['transaction_date', 'ASC'],

        ['created_at', 'ASC'],
      ],
    });

    const balances = new Map<
      string,
      {
        material: MaterialMaster;

        unit: Unit;

        quantity: number;

        total_in: number;

        total_out: number;
      }
    >();

    for (const transaction of transactions) {
      const material = transaction.material;

      if (!material) {
        continue;
      }

      const unit = transaction.unit ?? material.unit;

      if (!unit) {
        continue;
      }

      const key = transaction.material_id;

      if (!balances.has(key)) {
        balances.set(key, {
          material,

          unit,

          quantity: 0,

          total_in: 0,

          total_out: 0,
        });
      }

      const entry = balances.get(key)!;

      const quantity = Number(transaction.quantity);

      if (transaction.direction === InventoryDirection.IN) {
        entry.quantity += quantity;

        entry.total_in += quantity;
      } else if (transaction.direction === InventoryDirection.OUT) {
        entry.quantity -= quantity;

        entry.total_out += quantity;
      }
    }

    return Array.from(balances.values()).map((entry) => ({
      material: entry.material,

      unit: entry.unit,

      quantity: entry.quantity,

      total_in: entry.total_in,

      total_out: entry.total_out,

      stock_status:
        entry.quantity > 0
          ? 'IN_STOCK'
          : entry.quantity === 0
            ? 'OUT_OF_STOCK'
            : 'NEGATIVE_STOCK',
    }));
  }

  // ============================================================
  // INVENTORY SUMMARY
  // ============================================================

  async getInventorySummary(projectId: string, siteId?: string) {
    const stock = await this.getProjectStock(projectId, siteId);

    let totalMaterials = stock.length;

    let materialsWithStock = 0;

    let zeroStockMaterials = 0;

    let negativeStockMaterials = 0;

    let totalReceipts = 0;

    let totalIssues = 0;

    let totalIncoming = 0;

    let totalOutgoing = 0;

    for (const item of stock) {
      const quantity = Number(item.quantity);

      if (quantity > 0) {
        materialsWithStock++;
      }

      if (quantity === 0) {
        zeroStockMaterials++;
      }

      if (quantity < 0) {
        negativeStockMaterials++;
      }

      totalIncoming += Number(item.total_in ?? 0);

      totalOutgoing += Number(item.total_out ?? 0);
    }

    // ----------------------------------------------------------
    // Get transaction counts separately.
    // ----------------------------------------------------------

    const where: any = {
      project_id: projectId,
    };

    if (siteId) {
      where.site_id = siteId;
    }

    const transactions = await this.inventoryModel.findAll({
      where,

      attributes: ['transaction_type'],
    });

    for (const transaction of transactions) {
      if (transaction.transaction_type === InventoryTransactionType.RECEIPT) {
        totalReceipts++;
      }

      if (transaction.transaction_type === InventoryTransactionType.ISSUE) {
        totalIssues++;
      }
    }

    return {
      totalMaterials,

      materialsWithStock,

      zeroStockMaterials,

      negativeStockMaterials,

      totalReceipts,

      totalIssues,

      totalIncoming,

      totalOutgoing,
    };
  }

  // ============================================================
  // SITE STOCK
  // ============================================================

  /**
   * Alias/helper for frontend pages that specifically want
   * site inventory.
   */
  async getSiteStock(projectId: string, siteId: string) {
    if (!siteId) {
      throw new BadRequestException('Site is required');
    }

    return this.getProjectStock(projectId, siteId);
  }

  // ============================================================
  // MATERIAL STOCK DETAILS
  // ============================================================

  async getMaterialStockDetails(
    projectId: string,
    materialId: string,
    siteId?: string,
  ) {
    const material = await this.getValidMaterial(materialId);

    const quantity = await this.getCurrentStock(projectId, siteId, materialId);

    const history = await this.getMaterialHistory(
      projectId,
      materialId,
      siteId,
    );

    let totalIn = 0;

    let totalOut = 0;

    for (const transaction of history) {
      const quantity = Number(transaction.quantity);

      if (transaction.direction === InventoryDirection.IN) {
        totalIn += quantity;
      } else if (transaction.direction === InventoryDirection.OUT) {
        totalOut += quantity;
      }
    }

    return {
      material,

      unit: material.unit,

      project_id: projectId,

      site_id: siteId ?? null,

      current_stock: quantity,

      total_in: totalIn,

      total_out: totalOut,

      transaction_count: history.length,

      stock_status:
        quantity > 0
          ? 'IN_STOCK'
          : quantity === 0
            ? 'OUT_OF_STOCK'
            : 'NEGATIVE_STOCK',
    };
  }
}

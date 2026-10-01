import { randomUUID } from 'crypto';

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Project } from '@/modules/projects/models/projects.model';
import { InjectModel } from '@nestjs/sequelize';

import {
  fn,
  literal,
  Op,
  QueryTypes,
  Transaction as SequelizeTransaction,
} from 'sequelize';

import {
  InventoryDirection,
  InventoryTransaction,
  InventoryTransactionType,
  InventoryConditionStatus,
  InventoryReferenceType,
  YesNoNA,
} from '../models/inventory-transaction.model';

import { MaterialMaster } from '../models/material-master.model';

import {
  CreateInventoryTransactionDto,
  IssueMaterialDto,
  AdjustInventoryDto,
  TransferInventoryDto,
  ReturnInventoryDto,
  MaterialReceivedRegisterRow,
  MaterialIssuedRegisterRow,
} from '../dto/inventory.dto';

import { Unit } from '@/modules/metas/models/unit.model';

// ============================================================
// TYPES
// ============================================================

export interface SiteRegisterQuery {
  projectId: string;
  /** Free-text site location, e.g. "Main Site" or "Floor 1" */
  siteLocation?: string;
  materialId?: string;
  /** YYYY-MM-DD, inclusive */
  fromDate?: string;
  /** YYYY-MM-DD, inclusive */
  toDate?: string;
}

export interface ReceiveFromDeliveryParams {
  project_id: string;
  site_location?: string;
  material_id: string;
  quantity: number;
  delivery_challan_id: string;
  delivery_challan_item_id: string;
  /** Printed challan / bill number shown in the register */
  challan_bill_no?: string;
  vendor_id?: string;
  work_reference?: string;
  storage_location?: string;
  gate_pass_received?: YesNoNA;
  material_checked?: YesNoNA;
  condition_status?: InventoryConditionStatus;
  condition_notes?: string;
  received_by?: string;
  transaction_date: string;
  remarks?: string;
  /** Accepted quantity from the Delivery Challan service, if known */
  accepted_quantity?: number;
}

interface ReversalFields {
  reversal_of_id?: string | null;
  reversal_reason?: string | null;
}

/**
 * Tables used ONLY to turn ids into display names in the register.
 * Adjust to your schema. If a lookup fails the register still works and
 * the name is returned as null.
 */
const NAME_SOURCES = {
  vendor: { table: 'vendors', nameColumn: 'name' },
  contractor: { table: 'contractors', nameColumn: 'name' },
  user: { table: 'users', nameColumn: 'name' },
} as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SIGNED_QTY = `CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END`;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(InventoryTransaction)
    private readonly inventoryModel: typeof InventoryTransaction,

    @InjectModel(MaterialMaster)
    private readonly materialModel: typeof MaterialMaster,

    @InjectModel(Project)
    private readonly projectModel: typeof Project,
    @InjectModel(Unit)
    private readonly unitModel: typeof Unit,
  ) {}

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /** Determines whether a transaction increases or decreases stock. */
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

  private validateQuantity(quantity: number | string) {
    const value = Number(quantity);

    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    return value;
  }

  /** Accepts "2026-08-14" or a full ISO string, returns "2026-08-14". */
  private normalizeDate(value?: string | null): string {
    if (!value) {
      return new Date().toISOString().slice(0, 10);
    }

    const date = String(value).slice(0, 10);

    if (!DATE_RE.test(date)) {
      throw new BadRequestException(`Invalid date "${value}". Use YYYY-MM-DD`);
    }

    return date;
  }

  private assertOptionalDate(value: string | undefined, label: string) {
    if (value !== undefined && value !== '' && !DATE_RE.test(value)) {
      throw new BadRequestException(`${label} must be in YYYY-MM-DD format`);
    }
  }

  /**
   * Trims and collapses whitespace so "Floor 1" and " Floor  1 " land in
   * the same stock bucket. Empty values become null.
   */
  private normalizeLocation(value?: string | null): string | null {
    const v = value?.trim().replace(/\s+/g, ' ');
    return v ? v : null;
  }

  /** Adds the site_location filter to a where clause when one is given. */
  private applyLocationFilter(where: any, siteLocation?: string | null) {
    const location = this.normalizeLocation(siteLocation);

    if (location) where.site_location = location;

    return where;
  }

  private getSequelize() {
    const sequelize = this.inventoryModel.sequelize;

    if (!sequelize) {
      throw new BadRequestException(
        'Inventory database connection unavailable',
      );
    }

    return sequelize;
  }

  /** Validate material and load its configured unit. */
  private async getValidMaterial(
    materialId: string,
    transaction?: SequelizeTransaction,
  ): Promise<MaterialMaster> {
    if (!materialId) {
      throw new BadRequestException('Material is required');
    }

    const material = await this.materialModel.findByPk(materialId, {
      include: [{ model: Unit, as: 'unit', required: true }],
      transaction,
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
   * Takes a row lock on the material so two simultaneous OUT movements
   * of the same material are processed one after the other. Without this
   * both could pass the stock check and drive stock negative.
   */
  private async lockMaterial(
    materialId: string,
    transaction: SequelizeTransaction,
  ) {
    await this.materialModel.findByPk(materialId, {
      attributes: ['id'],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  /** Validate stock for an OUT movement. */
  private async validateAvailableStock(
    projectId: string,
    siteLocation: string | undefined,
    material: MaterialMaster,
    quantity: number,
    transaction?: SequelizeTransaction,
  ) {
    const available = await this.getCurrentStock(
      projectId,
      siteLocation,
      material.id,
      transaction,
    );

    if (quantity > available) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${available} ${
          material.unit?.code ?? ''
        }`,
      );
    }

    return available;
  }

  /** Common includes used by inventory queries. */
  private getInventoryIncludes() {
    return [
      {
        model: MaterialMaster,
        as: 'material',
        required: true,
        include: [{ model: Unit, as: 'unit', required: true }],
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
   * Central method for every stock movement.
   *
   * OUT movements run inside a DB transaction with a lock on the
   * material, so the stock check and the insert are atomic.
   */
  async create(
    dto: CreateInventoryTransactionDto & ReversalFields,
    userId?: string,
    dbTransaction?: SequelizeTransaction,
  ) {
    const quantity = this.validateQuantity(dto.quantity);
    const direction = this.getDirection(dto.transaction_type);
    const siteLocation = this.normalizeLocation(dto.site_location);

    const run = async (t?: SequelizeTransaction) => {
      const material = await this.getValidMaterial(dto.material_id, t);

      if (direction === InventoryDirection.OUT) {
        if (t) {
          await this.lockMaterial(dto.material_id, t);
        }

        await this.validateAvailableStock(
          dto.project_id,
          siteLocation ?? undefined,
          material,
          quantity,
          t,
        );
      }

      return this.inventoryModel.create(
        {
          ...dto,

          quantity,

          site_location: siteLocation,

          transaction_date: this.normalizeDate(dto.transaction_date),

          /** ALWAYS derive unit from MaterialMaster, never from the client. */
          unit_id: material.unit_id,

          direction,

          reference_type: dto.reference_type ?? null,
          reference_id: dto.reference_id ?? null,
          reference_item_id: dto.reference_item_id ?? null,

          reversal_of_id: dto.reversal_of_id ?? null,
          reversal_reason: dto.reversal_reason ?? null,

          vendor_id: dto.vendor_id ?? null,
          contractor_id: dto.contractor_id ?? null,
          trade: dto.trade ?? null,

          work_reference: dto.work_reference ?? null,
          storage_location: dto.storage_location ?? null,

          // register fields
          challan_bill_no: dto.challan_bill_no ?? null,
          gate_pass_received: dto.gate_pass_received ?? YesNoNA.NOT_APPLICABLE,
          material_checked: dto.material_checked ?? YesNoNA.NOT_APPLICABLE,

          condition_status:
            dto.condition_status ?? InventoryConditionStatus.NOT_APPLICABLE,
          condition_notes: dto.condition_notes ?? null,

          issued_to: dto.issued_to ?? null,
          issued_by: dto.issued_by ?? null,
          received_by: dto.received_by ?? null,

          remarks: dto.remarks ?? null,

          created_by: userId ?? null,
        },
        { transaction: t },
      );
    };

    let created: InventoryTransaction;

    if (dbTransaction) {
      created = await run(dbTransaction);
    } else if (direction === InventoryDirection.OUT) {
      created = await this.getSequelize().transaction((t) => run(t));
    } else {
      created = await run(undefined);
    }

    return this.findOne(created.id, dbTransaction);
  }

  // ============================================================
  // ADD / RECEIVE INVENTORY
  // ============================================================

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
    // Stock validation happens (atomically) inside create().
    return this.create(
      {
        ...dto,
        transaction_type: InventoryTransactionType.ISSUE,
        reference_type: InventoryReferenceType.ISSUE,
      } as CreateInventoryTransactionDto,
      userId,
    );
  }

  // ============================================================
  // ADJUST INVENTORY
  // ============================================================

  async adjust(dto: AdjustInventoryDto, userId?: string) {
    const direction = dto.direction;

    if (
      direction !== InventoryDirection.IN &&
      direction !== InventoryDirection.OUT
    ) {
      throw new BadRequestException('Adjustment direction must be IN or OUT');
    }

    const transactionType =
      direction === InventoryDirection.IN
        ? InventoryTransactionType.ADJUSTMENT_IN
        : InventoryTransactionType.ADJUSTMENT_OUT;

    return this.create(
      {
        ...dto,
        transaction_type: transactionType,
        reference_type: InventoryReferenceType.ADJUSTMENT,
        remarks: dto.reason ?? dto.remarks ?? 'Inventory adjustment',
      } as CreateInventoryTransactionDto,
      userId,
    );
  }

  // ============================================================
  // OPENING STOCK
  // ============================================================

  /** Opening inventory is represented as an ADJUSTMENT_IN. */
  async addOpeningStock(dto: AdjustInventoryDto, userId?: string) {
    return this.create(
      {
        ...dto,
        transaction_type: InventoryTransactionType.ADJUSTMENT_IN,
        reference_type: InventoryReferenceType.ADJUSTMENT,
        remarks: dto.reason ?? dto.remarks ?? 'Opening stock',
      } as CreateInventoryTransactionDto,
      userId,
    );
  }

  // ============================================================
  // REVERSAL / CORRECTION
  // ============================================================

  /**
   * Posted transactions are never edited or deleted. A mistake is
   * corrected by posting the opposite movement that points back at
   * the original via reversal_of_id.
   */
  async reverse(id: string, reason: string, userId?: string) {
    if (!reason || !reason.trim()) {
      throw new BadRequestException('A reason is required to reverse an entry');
    }

    const original = await this.findOne(id);

    if (original.reversal_of_id) {
      throw new BadRequestException('A reversal entry cannot be reversed');
    }

    const alreadyReversed = await this.inventoryModel.findOne({
      where: { reversal_of_id: id },
      attributes: ['id'],
    });

    if (alreadyReversed) {
      throw new BadRequestException('This entry has already been reversed');
    }

    const type =
      original.direction === InventoryDirection.IN
        ? InventoryTransactionType.ADJUSTMENT_OUT
        : InventoryTransactionType.ADJUSTMENT_IN;

    return this.create(
      {
        project_id: original.project_id,
        site_location: original.site_location ?? undefined,
        material_id: original.material_id,
        transaction_date: new Date().toISOString().slice(0, 10),
        transaction_type: type,
        quantity: Number(original.quantity),
        reference_type: InventoryReferenceType.ADJUSTMENT,
        reference_id: original.reference_id ?? undefined,
        reference_item_id: original.reference_item_id ?? undefined,
        reversal_of_id: original.id,
        reversal_reason: reason.trim(),
        remarks: `Reversal of ${original.transaction_type}: ${reason.trim()}`,
      } as CreateInventoryTransactionDto & ReversalFields,
      userId,
    );
  }

  // ============================================================
  // TRANSFER INVENTORY
  // ============================================================

  /**
   * TRANSFER_OUT from source + TRANSFER_IN to destination, both with
   * the same reference_id, in one DB transaction.
   */
  async transfer(dto: TransferInventoryDto, userId?: string) {
    const fromLocation = this.normalizeLocation(dto.from_site_location);
    const toLocation = this.normalizeLocation(dto.to_site_location);

    if (!fromLocation || !toLocation) {
      throw new BadRequestException(
        'Both source and destination locations are required',
      );
    }

    if (fromLocation.toLowerCase() === toLocation.toLowerCase()) {
      throw new BadRequestException(
        'Source and destination locations must be different',
      );
    }

    const quantity = this.validateQuantity(dto.quantity);
    const transactionDate = this.normalizeDate(dto.transaction_date);

    return this.getSequelize().transaction(async (transaction) => {
      const material = await this.getValidMaterial(
        dto.material_id,
        transaction,
      );

      await this.lockMaterial(dto.material_id, transaction);

      await this.validateAvailableStock(
        dto.project_id,
        fromLocation,
        material,
        quantity,
        transaction,
      );

      // reference_id column is a UUID
      const transferId = dto.reference_id ?? randomUUID();

      const base = {
        project_id: dto.project_id,
        material_id: dto.material_id,
        transaction_date: transactionDate,
        quantity,
        unit_id: material.unit_id,
        reference_type: InventoryReferenceType.TRANSFER,
        reference_id: transferId,
        reference_item_id: dto.reference_item_id ?? null,
        vendor_id: null,
        contractor_id: null,
        trade: null,
        work_reference: dto.work_reference ?? null,
        condition_status: InventoryConditionStatus.NOT_APPLICABLE,
        condition_notes: null,
        issued_to: null,
        remarks: dto.remarks ?? 'Inventory transfer',
        created_by: userId ?? null,
      };

      const transferOut = await this.inventoryModel.create(
        {
          ...base,
          site_location: fromLocation,
          transaction_type: InventoryTransactionType.TRANSFER_OUT,
          direction: InventoryDirection.OUT,
          storage_location: dto.from_storage_location ?? null,
          issued_by: dto.issued_by ?? userId ?? null,
          received_by: null,
        },
        { transaction },
      );

      const transferIn = await this.inventoryModel.create(
        {
          ...base,
          site_location: toLocation,
          transaction_type: InventoryTransactionType.TRANSFER_IN,
          direction: InventoryDirection.IN,
          storage_location: dto.to_storage_location ?? null,
          issued_by: null,
          received_by: dto.received_by ?? userId ?? null,
        },
        { transaction },
      );

      return {
        transfer_id: transferId,
        quantity,
        unit: material.unit,
        from_site_location: fromLocation,
        to_site_location: toLocation,
        transfer_out: transferOut,
        transfer_in: transferIn,
      };
    });
  }

  // ============================================================
  // RETURNS
  // ============================================================

  /**
   * RETURN_FROM_CONTRACTOR increases stock.
   * RETURN_TO_VENDOR decreases stock (validated in create()).
   */
  async returnMaterial(dto: ReturnInventoryDto, userId?: string) {
    if (
      dto.return_type !== InventoryTransactionType.RETURN_FROM_CONTRACTOR &&
      dto.return_type !== InventoryTransactionType.RETURN_TO_VENDOR
    ) {
      throw new BadRequestException('Invalid return type');
    }

    return this.create(
      {
        ...dto,
        transaction_type: dto.return_type,
        reference_type: dto.reference_type ?? InventoryReferenceType.RETURN,
      } as CreateInventoryTransactionDto,
      userId,
    );
  }

  // ============================================================
  // RECEIVE FROM DELIVERY CHALLAN
  // ============================================================

  async receiveFromDelivery(
    params: ReceiveFromDeliveryParams,
    userId?: string,
  ) {
    const quantity = this.validateQuantity(params.quantity);

    await this.getValidMaterial(params.material_id);

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
      // Without accepted_quantity we can only stop exact duplicates.
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
        site_location: params.site_location,
        material_id: params.material_id,
        transaction_date: params.transaction_date,
        transaction_type: InventoryTransactionType.RECEIPT,
        quantity,
        reference_type: InventoryReferenceType.DELIVERY_CHALLAN,
        reference_id: params.delivery_challan_id,
        reference_item_id: params.delivery_challan_item_id,
        challan_bill_no: params.challan_bill_no,
        vendor_id: params.vendor_id,
        work_reference: params.work_reference,
        storage_location: params.storage_location,
        gate_pass_received: params.gate_pass_received,
        material_checked: params.material_checked,
        condition_status: params.condition_status,
        condition_notes: params.condition_notes,
        received_by: params.received_by,
        remarks: params.remarks,
      } as CreateInventoryTransactionDto,
      userId,
    );
  }

  // ============================================================
  // FIND ALL TRANSACTIONS
  // ============================================================

  async findAll(params?: {
    projectId?: string;
    siteLocation?: string;
    materialId?: string;
    transactionType?: string;
    referenceType?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (params?.projectId) where.project_id = params.projectId;
    this.applyLocationFilter(where, params?.siteLocation);
    if (params?.materialId) where.material_id = params.materialId;
    if (params?.transactionType)
      where.transaction_type = params.transactionType;
    if (params?.referenceType) where.reference_type = params.referenceType;

    this.assertOptionalDate(params?.fromDate, 'fromDate');
    this.assertOptionalDate(params?.toDate, 'toDate');

    if (params?.fromDate || params?.toDate) {
      where.transaction_date = {};

      if (params.fromDate) where.transaction_date[Op.gte] = params.fromDate;
      if (params.toDate) where.transaction_date[Op.lte] = params.toDate;
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

  async findOne(id: string, transaction?: SequelizeTransaction) {
    const row = await this.inventoryModel.findByPk(id, {
      include: this.getInventoryIncludes(),
      transaction,
    });

    if (!row) {
      throw new NotFoundException('Inventory transaction not found');
    }

    return row;
  }

  // ============================================================
  // CURRENT STOCK (SQL SUM, no row loading)
  // ============================================================

  async getCurrentStock(
    projectId: string,
    siteLocation: string | undefined,
    materialId: string,
    transaction?: SequelizeTransaction,
  ): Promise<number> {
    const where: any = {
      project_id: projectId,
      material_id: materialId,
    };

    this.applyLocationFilter(where, siteLocation);

    const row: any = await this.inventoryModel.findOne({
      where,
      attributes: [
        [fn('COALESCE', fn('SUM', literal(SIGNED_QTY)), 0), 'balance'],
      ],
      raw: true,
      transaction,
    });

    return Number(row?.balance ?? 0);
  }

  // ============================================================
  // MATERIAL HISTORY
  // ============================================================

  async getMaterialHistory(
    projectId: string,
    materialId: string,
    siteLocation?: string,
  ) {
    const where: any = {
      project_id: projectId,
      material_id: materialId,
    };

    this.applyLocationFilter(where, siteLocation);

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

  async getProjectStock(projectId: string, siteLocation?: string) {
    const where: any = { project_id: projectId };

    this.applyLocationFilter(where, siteLocation);

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
      if (!material) continue;

      const unit = transaction.unit ?? material.unit;
      if (!unit) continue;

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

  async getInventorySummary(projectId: string, siteLocation?: string) {
    const stock = await this.getProjectStock(projectId, siteLocation);

    let materialsWithStock = 0;
    let zeroStockMaterials = 0;
    let negativeStockMaterials = 0;
    let totalIncoming = 0;
    let totalOutgoing = 0;

    for (const item of stock) {
      const quantity = Number(item.quantity);

      if (quantity > 0) materialsWithStock++;
      if (quantity === 0) zeroStockMaterials++;
      if (quantity < 0) negativeStockMaterials++;

      totalIncoming += Number(item.total_in ?? 0);
      totalOutgoing += Number(item.total_out ?? 0);
    }

    const where: any = { project_id: projectId };
    this.applyLocationFilter(where, siteLocation);

    const transactions = await this.inventoryModel.findAll({
      where,
      attributes: ['transaction_type'],
    });

    let totalReceipts = 0;
    let totalIssues = 0;

    for (const transaction of transactions) {
      if (transaction.transaction_type === InventoryTransactionType.RECEIPT) {
        totalReceipts++;
      }
      if (transaction.transaction_type === InventoryTransactionType.ISSUE) {
        totalIssues++;
      }
    }

    return {
      totalMaterials: stock.length,
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

  async getSiteStock(projectId: string, siteLocation: string) {
    if (!this.normalizeLocation(siteLocation)) {
      throw new BadRequestException('Site location is required');
    }

    return this.getProjectStock(projectId, siteLocation);
  }

  // ============================================================
  // MATERIAL STOCK DETAILS
  // ============================================================

  async getMaterialStockDetails(
    projectId: string,
    materialId: string,
    siteLocation?: string,
  ) {
    const material = await this.getValidMaterial(materialId);

    const currentStock = await this.getCurrentStock(
      projectId,
      siteLocation,
      materialId,
    );

    const history = await this.getMaterialHistory(
      projectId,
      materialId,
      siteLocation,
    );

    let totalIn = 0;
    let totalOut = 0;

    for (const row of history) {
      const quantity = Number(row.quantity);

      if (row.direction === InventoryDirection.IN) {
        totalIn += quantity;
      } else if (row.direction === InventoryDirection.OUT) {
        totalOut += quantity;
      }
    }

    return {
      material,
      unit: material.unit,
      project_id: projectId,
      site_location: this.normalizeLocation(siteLocation),
      current_stock: currentStock,
      total_in: totalIn,
      total_out: totalOut,
      transaction_count: history.length,
      stock_status:
        currentStock > 0
          ? 'IN_STOCK'
          : currentStock === 0
            ? 'OUT_OF_STOCK'
            : 'NEGATIVE_STOCK',
    };
  }

  // ============================================================
  // ============================================================
  //  SITE INVENTORY REGISTER
  // ============================================================
  // ============================================================

  /**
   * id -> display name using a raw lookup. Never throws: if the table
   * or column does not exist the register still renders, names are null.
   */
  private async lookupNames(
    source: { table: string; nameColumn: string },
    ids: Array<string | null | undefined>,
  ): Promise<Map<string, string>> {
    const unique = [...new Set(ids.filter(Boolean))] as string[];
    const result = new Map<string, string>();

    if (!unique.length) return result;

    try {
      const rows: any[] = await this.getSequelize().query(
        `SELECT id, ${source.nameColumn} AS name FROM ${source.table} WHERE id IN (:ids)`,
        { replacements: { ids: unique }, type: QueryTypes.SELECT },
      );

      for (const row of rows) {
        result.set(String(row.id), row.name);
      }
    } catch (error) {
      this.logger.warn(
        `Name lookup on "${source.table}" failed: ${(error as Error).message}`,
      );
    }

    return result;
  }

  private async resolveNames(rows: InventoryTransaction[]) {
    const [vendor, contractor, user] = await Promise.all([
      this.lookupNames(
        NAME_SOURCES.vendor,
        rows.map((r) => r.vendor_id),
      ),
      this.lookupNames(
        NAME_SOURCES.contractor,
        rows.map((r) => r.contractor_id),
      ),
      this.lookupNames(
        NAME_SOURCES.user,
        rows.flatMap((r) => [r.received_by, r.issued_by]),
      ),
    ]);

    return { vendor, contractor, user };
  }

  /** "Vitrified tile 600x600, matte ivory" = name + specification */
  private materialDescription(material: MaterialMaster) {
    return [material.name, material.specification].filter(Boolean).join(', ');
  }

  /**
   * Loads the ledger up to toDate in chronological order and computes the
   * running balance per material. The history BEFORE fromDate is loaded
   * too so balances are right, then the window is applied afterwards.
   */
  private async loadLedgerWithBalance(query: SiteRegisterQuery) {
    this.assertOptionalDate(query.fromDate, 'fromDate');
    this.assertOptionalDate(query.toDate, 'toDate');

    const where: any = { project_id: query.projectId };

    this.applyLocationFilter(where, query.siteLocation);
    if (query.materialId) where.material_id = query.materialId;
    if (query.toDate) where.transaction_date = { [Op.lte]: query.toDate };

    const rows = await this.inventoryModel.findAll({
      where,
      include: this.getInventoryIncludes(),
      order: [
        ['transaction_date', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    const running = new Map<string, number>();

    const withBalance = rows.map((row) => {
      const quantity = Number(row.quantity);
      const previous = running.get(row.material_id) ?? 0;
      const next =
        row.direction === InventoryDirection.IN
          ? previous + quantity
          : previous - quantity;

      running.set(row.material_id, next);

      return { row, balance_after: next };
    });

    return query.fromDate
      ? withBalance.filter((x) => x.row.transaction_date >= query.fromDate!)
      : withBalance;
  }

  async getReceivedRegister(
    query: SiteRegisterQuery,
  ): Promise<MaterialReceivedRegisterRow[]> {
    const ledger = (await this.loadLedgerWithBalance(query)).filter(
      (x) => x.row.direction === InventoryDirection.IN,
    );

    const names = await this.resolveNames(ledger.map((x) => x.row));

    return ledger.map(({ row, balance_after }) => {
      const condition = [
        row.condition_status !== InventoryConditionStatus.NOT_APPLICABLE
          ? row.condition_status
          : null,
        row.condition_notes,
      ]
        .filter(Boolean)
        .join(' – ');

      return {
        id: row.id,
        date: row.transaction_date,
        material_id: row.material_id,
        material_code: row.material?.material_code ?? null,
        material_description: row.material
          ? this.materialDescription(row.material)
          : null,
        brand: row.material?.brand ?? null,
        received_from: row.vendor_id
          ? (names.vendor.get(row.vendor_id) ?? null)
          : null,
        vendor_id: row.vendor_id,
        for_which_work: row.work_reference,
        qty: Number(row.quantity),
        unit: row.unit?.code ?? row.material?.unit?.code ?? null,
        challan_bill_no: row.challan_bill_no,
        gate_pass_received: row.gate_pass_received,
        material_checked: row.material_checked,
        condition_shortage_noted: condition || null,
        stored_at: row.storage_location,
        received_by: row.received_by
          ? (names.user.get(row.received_by) ?? null)
          : null,
        remarks: row.remarks,
        transaction_type: row.transaction_type,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        reversal_of_id: row.reversal_of_id,
        balance_after,
      };
    });
  }

  async getIssuedRegister(
    query: SiteRegisterQuery,
  ): Promise<MaterialIssuedRegisterRow[]> {
    const ledger = (await this.loadLedgerWithBalance(query)).filter(
      (x) => x.row.direction === InventoryDirection.OUT,
    );

    const names = await this.resolveNames(ledger.map((x) => x.row));

    return ledger.map(({ row, balance_after }) => {
      const contractorName = row.contractor_id
        ? (names.contractor.get(row.contractor_id) ?? null)
        : null;

      return {
        id: row.id,
        date: row.transaction_date,
        material_id: row.material_id,
        material_code: row.material?.material_code ?? null,
        material_description: row.material
          ? this.materialDescription(row.material)
          : null,
        qty_issued: Number(row.quantity),
        unit: row.unit?.code ?? row.material?.unit?.code ?? null,
        issued_to: row.issued_to ?? contractorName ?? row.trade ?? null,
        contractor_id: row.contractor_id,
        trade: row.trade,
        for_which_work: row.work_reference,
        issued_by: row.issued_by
          ? (names.user.get(row.issued_by) ?? null)
          : null,
        remarks: row.remarks,
        transaction_type: row.transaction_type,
        reference_type: row.reference_type,
        reference_id: row.reference_id,
        reversal_of_id: row.reversal_of_id,
        balance_after,
      };
    });
  }

  /** Balance per material (what is in the store now / at toDate). */
  async getRegisterBalance(query: SiteRegisterQuery) {
    this.assertOptionalDate(query.toDate, 'toDate');

    const where: any = { project_id: query.projectId };

    this.applyLocationFilter(where, query.siteLocation);
    if (query.materialId) where.material_id = query.materialId;
    if (query.toDate) where.transaction_date = { [Op.lte]: query.toDate };

    const rows: any[] = await this.inventoryModel.findAll({
      where,
      attributes: [
        'material_id',
        [
          fn(
            'SUM',
            literal(`CASE WHEN direction = 'IN' THEN quantity ELSE 0 END`),
          ),
          'total_in',
        ],
        [
          fn(
            'SUM',
            literal(`CASE WHEN direction = 'OUT' THEN quantity ELSE 0 END`),
          ),
          'total_out',
        ],
        [fn('MAX', literal('transaction_date')), 'last_movement'],
      ],
      group: ['material_id'],
      raw: true,
    });

    if (!rows.length) return [];

    const materials = await this.materialModel.findAll({
      where: { id: rows.map((r) => r.material_id) },
      include: [{ model: Unit, as: 'unit' }],
    });

    const byId = new Map(materials.map((m) => [m.id, m]));

    return rows
      .map((r) => {
        const material = byId.get(r.material_id);
        const received = Number(r.total_in ?? 0);
        const issued = Number(r.total_out ?? 0);
        const balance = received - issued;

        return {
          material_id: r.material_id,
          material_code: material?.material_code ?? null,
          material_description: material
            ? this.materialDescription(material)
            : null,
          brand: material?.brand ?? null,
          unit: material?.unit?.code ?? null,
          total_received: received,
          total_issued: issued,
          balance,
          last_movement: r.last_movement,
          stock_status:
            balance > 0
              ? 'IN_STOCK'
              : balance === 0
                ? 'OUT_OF_STOCK'
                : 'NEGATIVE_STOCK',
        };
      })
      .sort((a, b) =>
        (a.material_description ?? '').localeCompare(
          b.material_description ?? '',
        ),
      );
  }

  /** Everything the register screen needs in one call. */
  async getSiteRegister(query: SiteRegisterQuery) {
    if (!query.projectId) {
      throw new BadRequestException('Project is required');
    }

    // ------------------------------------------------------------
    // Resolve site location
    // ------------------------------------------------------------
    // If frontend sends siteLocation, use it.
    // Otherwise fall back to the project's canonical site_location.
    // ------------------------------------------------------------

    let siteLocation = this.normalizeLocation(query.siteLocation);

    if (!siteLocation) {
      const project = await this.projectModel.findByPk(query.projectId, {
        attributes: ['id', 'site_location'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      siteLocation = this.normalizeLocation(project.site_location);

      if (!siteLocation) {
        throw new BadRequestException(
          'Site location is not configured for this project',
        );
      }
    }

    const normalizedQuery: SiteRegisterQuery = {
      ...query,
      siteLocation,
    };

    const [received, issued, balance] = await Promise.all([
      this.getReceivedRegister(normalizedQuery),
      this.getIssuedRegister(normalizedQuery),
      this.getRegisterBalance(normalizedQuery),
    ]);

    return {
      project_id: query.projectId,
      site_location: siteLocation,
      from_date: query.fromDate ?? null,
      to_date: query.toDate ?? null,
      generated_at: new Date().toISOString(),

      counts: {
        received: received.length,
        issued: issued.length,
        materials: balance.length,
      },

      received,
      issued,
      balance,
    };
  }
}

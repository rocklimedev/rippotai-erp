import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { QuotationVersion } from './models/quotation-versions.model';
import { Quotation } from './models/quotations.model';
import { QuotationItem } from './models/quotation-items.model';

/**
 * Quotation fields written back on restore. Deliberately excludes createdBy,
 * deletedAt and deletedBy: restoring a version should not change who created
 * the quotation or whether it is deleted.
 */
const RESTORABLE_FIELDS = [
  'quotationNumber',
  'quotationDate',
  'status',
  'projectId',
  'vendorId',
  'projectSnapshot',
  'vendorSnapshot',
  'subtotal',
  'additionalCharges',
  'globalDiscountType',
  'globalDiscountValue',
  'discount',
  'taxPercent',
  'taxAmount',
  'totalAmount',
  'termsConditions',
  'submittedAt',
  'submittedBy',
  'reviewedAt',
  'reviewedBy',
  'reviewRemarks',
] as const;

@Injectable()
export class QuotationVersionsService {
  constructor(
    @InjectModel(QuotationVersion)
    private readonly quotationVersionModel: typeof QuotationVersion,

    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,

    @InjectModel(QuotationItem)
    private readonly quotationItemModel: typeof QuotationItem,
  ) {}

  private get sequelize() {
    return this.quotationModel.sequelize!;
  }

  /**
   * Loads the quotation with a row lock so that concurrent version creation or
   * restore calls for the same quotation are serialized.
   */
  private async lockQuotation(
    quotationId: string,
    tx: Transaction,
  ): Promise<Quotation> {
    const quotation = await this.quotationModel.findByPk(quotationId, {
      transaction: tx,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation ${quotationId} not found`);
    }
    return quotation;
  }

  private async nextVersionNumber(
    quotationId: string,
    tx: Transaction,
  ): Promise<number> {
    const last = await this.quotationVersionModel.findOne({
      where: { quotationId },
      order: [['version', 'DESC']],
      transaction: tx,
    });
    return (last?.version ?? 0) + 1;
  }

  /** Snapshot of the quotation plus its items as plain objects. */
  private buildSnapshot(quotation: Quotation): Record<string, any> {
    const snapshot = quotation.toJSON() as Record<string, any>;
    snapshot.items = (quotation.items ?? []).map((it: any) => ({
      id: it.id,
      sno: it.sno,
      particular: it.particular,
      rate: it.rate,
      quantity: it.quantity,
      amount: it.amount,
      remarks: it.remarks ?? null,
    }));
    return snapshot;
  }

  // Create a new version for a quotation (snapshot includes quotation + items)
  async createVersion(
    quotationId: string,
    createdBy?: string | null,
    remarks?: string | null,
  ): Promise<QuotationVersion> {
    return this.sequelize.transaction(async (tx) => {
      const quotation = await this.lockQuotation(quotationId, tx);
      await quotation.reload({
        include: ['items', 'project', 'vendor'],
        transaction: tx,
      });

      const nextVersion = await this.nextVersionNumber(quotationId, tx);
      const snapshot = this.buildSnapshot(quotation);

      const versionRow = await this.quotationVersionModel.create(
        {
          quotationId,
          version: nextVersion,
          snapshot,
          remarks: remarks ?? null,
          createdBy: createdBy ?? null,
        } as any,
        { transaction: tx },
      );

      await quotation.update({ currentVersion: nextVersion } as any, {
        transaction: tx,
      });

      return versionRow;
    });
  }

  async listVersions(quotationId: string): Promise<QuotationVersion[]> {
    return this.quotationVersionModel.findAll({
      where: { quotationId },
      order: [['version', 'DESC']],
    });
  }

  async getVersion(id: string): Promise<QuotationVersion> {
    const v = await this.quotationVersionModel.findByPk(id);
    if (!v) throw new NotFoundException(`Quotation version ${id} not found`);
    return v;
  }

  async deleteVersion(id: string): Promise<void> {
    const v = await this.quotationVersionModel.findByPk(id);
    if (!v) throw new NotFoundException(`Quotation version ${id} not found`);

    const quotation = await this.quotationModel.findByPk(v.quotationId, {
      attributes: ['id', 'currentVersion'],
    });
    if (quotation && quotation.currentVersion === v.version) {
      throw new BadRequestException(
        'Cannot delete the version the quotation is currently on',
      );
    }

    await v.destroy();
  }

  /**
   * Restores a version snapshot into the quotation and its items.
   * The restore is recorded as a new version (next number), so version history
   * stays append-only and version numbers stay unique.
   */
  async restoreVersion(
    id: string,
    restoredBy?: string | null,
  ): Promise<Quotation> {
    return this.sequelize.transaction(async (tx) => {
      const source = await this.quotationVersionModel.findByPk(id, {
        transaction: tx,
      });
      if (!source)
        throw new NotFoundException(`Quotation version ${id} not found`);

      const quotationId = source.quotationId;
      const quotation = await this.lockQuotation(quotationId, tx);
      const snapshot = source.snapshot as Record<string, any>;

      const changes: Record<string, unknown> = {};
      for (const field of RESTORABLE_FIELDS) {
        if (snapshot[field] !== undefined) changes[field] = snapshot[field];
      }
      changes.updatedBy = restoredBy ?? null;

      await quotation.update(changes, { transaction: tx });

      // Replace items. Snapshot item ids are not reused: they may collide with
      // rows that still exist, so the database assigns fresh ids.
      await this.quotationItemModel.destroy({
        where: { quotation_id: quotationId },
        transaction: tx,
      });

      const items = (snapshot.items ?? []).map((it: any) => ({
        sno: it.sno,
        particular: it.particular,
        rate: it.rate,
        quantity: it.quantity,
        amount: it.amount,
        remarks: it.remarks ?? null,
        quotation_id: quotationId,
      }));

      if (items.length) {
        await this.quotationItemModel.bulkCreate(items as any[], {
          transaction: tx,
        });
      }

      const nextVersion = await this.nextVersionNumber(quotationId, tx);

      await this.quotationVersionModel.create(
        {
          quotationId,
          version: nextVersion,
          snapshot,
          remarks: `Restored from version ${source.version}`,
          createdBy: restoredBy ?? null,
        } as any,
        { transaction: tx },
      );

      await quotation.update({ currentVersion: nextVersion } as any, {
        transaction: tx,
      });

      return quotation.reload({
        include: ['items', 'project', 'vendor'],
        transaction: tx,
      });
    });
  }
}

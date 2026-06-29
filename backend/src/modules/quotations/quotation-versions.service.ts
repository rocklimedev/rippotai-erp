import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QuotationVersion } from './models/quotation-versions.model';
import { Quotation } from './models/quotations.model';
import { QuotationItem } from './models/quotation-items.model';
import { Op } from 'sequelize';

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

  // Create a new version for a quotation (snapshot includes quotation + items)
  async createVersion(
    quotationId: string,
    createdBy?: string | null,
    remarks?: string | null,
  ): Promise<QuotationVersion> {
    const sequelize = this.quotationModel.sequelize!;
    return await sequelize.transaction(async (tx) => {
      const quotation = await this.quotationModel.findByPk(quotationId, {
        include: ['items', 'project', 'vendor'],
        transaction: tx,
      });

      if (!quotation)
        throw new NotFoundException(`Quotation ${quotationId} not found`);

      // compute next version number
      const lastVersion = await this.quotationVersionModel.findOne({
        where: { quotationId },
        order: [['version', 'DESC']],
        transaction: tx,
      });

      const nextVersion = (lastVersion?.version ?? 0) + 1;

      // build snapshot
      const snapshot = quotation.toJSON() as any;
      // ensure snapshot contains items in a plain array
      snapshot.items = (quotation.items ?? []).map((it: any) => ({
        id: it.id,
        sno: it.sno,
        particular: it.particular,
        rate: it.rate,
        quantity: it.quantity,
        amount: it.amount,
        remarks: it.remarks,
      }));

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

      // update quotation.currentVersion
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
    await v.destroy();
  }

  // Restore a version snapshot into the quotation and its items. Also sets currentVersion.
  async restoreVersion(
    id: string,
    restoredBy?: string | null,
  ): Promise<Quotation> {
    const sequelize = this.quotationModel.sequelize!;
    return await sequelize.transaction(async (tx) => {
      const version = await this.quotationVersionModel.findByPk(id, {
        transaction: tx,
      });
      if (!version)
        throw new NotFoundException(`Quotation version ${id} not found`);

      const snapshot = version.snapshot as any;
      const quotationId = version.quotationId;

      const quotation = await this.quotationModel.findByPk(quotationId, {
        transaction: tx,
      });
      if (!quotation)
        throw new NotFoundException(`Quotation ${quotationId} not found`);

      // Restore basic fields from snapshot (avoid overriding id/createdAt/updatedAt fields).
      const allowedFields = [
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
        'deletedAt',
        'deletedBy',
        'createdBy',
        'updatedBy',
      ];

      const dataToUpdate: any = {};
      for (const f of allowedFields) {
        if (snapshot[f] !== undefined) dataToUpdate[f] = snapshot[f];
      }

      // set currentVersion to the restored version number
      dataToUpdate.currentVersion = version.version;

      await quotation.update(dataToUpdate, { transaction: tx });

      // replace items with snapshot items
      await this.quotationItemModel.destroy({
        where: { quotation_id: quotationId },
        transaction: tx,
      });

      const items: any[] = (snapshot.items ?? []).map((it: any) => ({
        id: it.id, // keep id if present (will be used if DB allows explicit id inserts), otherwise DB will create new UUID
        sno: it.sno,
        particular: it.particular,
        rate: it.rate,
        quantity: it.quantity,
        amount: it.amount,
        remarks: it.remarks ?? null,
        quotation_id: quotationId,
      }));

      if (items.length) {
        await this.quotationItemModel.bulkCreate(items as any, {
          transaction: tx,
        });
      }

      // Optionally, record a new version to indicate a restore event.
      await this.quotationVersionModel.create(
        {
          quotationId,
          version: version.version, // keep version number same as restored version
          snapshot,
          remarks: `Restored to version ${version.version}`,
          createdBy: restoredBy ?? null,
        } as any,
        { transaction: tx },
      );

      return this.quotationModel.findByPk(quotationId, {
        include: ['items', 'project', 'vendor'],
        transaction: tx,
      }) as Promise<Quotation>;
    });
  }
}

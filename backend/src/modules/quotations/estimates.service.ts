import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Estimate } from './models/estimate.model';
import { EstimateItem } from './models/estimate-item.model';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { RejectEstimateDto } from './dto/reject-estimate.dto';
import { EstimateStatus } from '@/common/enums/estimate.enums';
import { Quotation } from './models/quotations.model';

@Injectable()
export class EstimatesService {
  constructor(
    @InjectModel(Estimate) private readonly estimateModel: typeof Estimate,
    @InjectModel(EstimateItem)
    private readonly estimateItemModel: typeof EstimateItem,
    @InjectModel(Quotation) private readonly quotationModel: typeof Quotation,
    private readonly sequelize: Sequelize,
  ) {}

  private static computeAmount(quantity: number, rate: number): number {
    return Math.round(quantity * rate * 100) / 100;
  }

  async create(dto: CreateEstimateDto, userId?: string): Promise<Estimate> {
    return this.sequelize.transaction(async (transaction) => {
      const subtotal = dto.items.reduce(
        (sum, item) =>
          sum + EstimatesService.computeAmount(item.quantity, item.rate),
        0,
      );

      const estimate = await this.estimateModel.create(
        {
          estimateNumber: dto.estimateNumber,
          projectId: dto.projectId,
          vendorId: dto.vendorId ?? null,
          tradeTeamId: dto.tradeTeamId ?? null,
          sourcePath: dto.sourcePath,
          category: dto.category,
          status: EstimateStatus.DRAFT,
          subtotal,
          totalAmount: subtotal,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        } as any,
        { transaction },
      );

      await this.estimateItemModel.bulkCreate(
        dto.items.map((item, index) => ({
          estimateId: estimate.id,
          particular: item.particular,
          unitId: item.unitId ?? null,
          quantity: item.quantity,
          rate: item.rate,
          amount: EstimatesService.computeAmount(item.quantity, item.rate),
          sortOrder: item.sortOrder ?? index,
        })) as any,
        { transaction },
      );

      return this.findOne(estimate.id, transaction);
    });
  }

  async findAll(filters: {
    projectId?: string;
    vendorId?: string;
    tradeTeamId?: string;
    status?: EstimateStatus;
  }): Promise<Estimate[]> {
    const where: Record<string, unknown> = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.tradeTeamId) where.tradeTeamId = filters.tradeTeamId;
    if (filters.status) where.status = filters.status;

    return this.estimateModel.findAll({
      where,
      include: [{ model: EstimateItem, as: 'items' }],
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string, transaction?: any): Promise<Estimate> {
    const estimate = await this.estimateModel.findByPk(id, {
      include: [{ model: EstimateItem, as: 'items' }],
      transaction,
    });
    if (!estimate) {
      throw new NotFoundException(`Estimate ${id} not found`);
    }
    return estimate;
  }

  async update(
    id: string,
    dto: UpdateEstimateDto,
    userId?: string,
  ): Promise<Estimate> {
    return this.sequelize.transaction(async (transaction) => {
      const estimate = await this.findOne(id, transaction);

      if (
        [EstimateStatus.APPROVED, EstimateStatus.CONVERTED].includes(
          estimate.status,
        )
      ) {
        throw new ConflictException(
          'Approved or converted estimates cannot be edited',
        );
      }

      if (dto.items) {
        await this.estimateItemModel.destroy({
          where: { estimateId: id },
          transaction,
        });
        await this.estimateItemModel.bulkCreate(
          dto.items.map((item, index) => ({
            estimateId: id,
            particular: item.particular,
            unitId: item.unitId ?? null,
            quantity: item.quantity,
            rate: item.rate,
            amount: EstimatesService.computeAmount(item.quantity, item.rate),
            sortOrder: item.sortOrder ?? index,
          })) as any,
          { transaction },
        );
      }

      const subtotal = dto.items
        ? dto.items.reduce(
            (sum, item) =>
              sum + EstimatesService.computeAmount(item.quantity, item.rate),
            0,
          )
        : estimate.subtotal;

      await estimate.update(
        {
          estimateNumber: dto.estimateNumber ?? estimate.estimateNumber,
          vendorId: dto.vendorId ?? estimate.vendorId,
          tradeTeamId: dto.tradeTeamId ?? estimate.tradeTeamId,
          sourcePath: dto.sourcePath ?? estimate.sourcePath,
          category: dto.category ?? estimate.category,
          subtotal,
          totalAmount: subtotal,
          updatedBy: userId ?? estimate.updatedBy,
        },
        { transaction },
      );

      return this.findOne(id, transaction);
    });
  }

  async remove(id: string): Promise<void> {
    const estimate = await this.findOne(id);
    if (estimate.status === EstimateStatus.CONVERTED) {
      throw new ConflictException('Converted estimates cannot be deleted');
    }
    await estimate.destroy();
  }

  async submit(id: string, userId?: string): Promise<Estimate> {
    const estimate = await this.findOne(id);
    if (estimate.status !== EstimateStatus.DRAFT) {
      throw new ConflictException('Only draft estimates can be submitted');
    }
    await estimate.update({
      status: EstimateStatus.SUBMITTED,
      updatedBy: userId ?? estimate.updatedBy,
    });
    return this.findOne(id);
  }

  /**
   * Approves an estimate and converts it into a `quotations` row.
   * One rule applies for both trade and material estimates.
   */
  async approve(id: string, userId?: string): Promise<Estimate> {
    return this.sequelize.transaction(async (transaction) => {
      const estimate = await this.findOne(id, transaction);

      if (estimate.status !== EstimateStatus.SUBMITTED) {
        throw new ConflictException('Only submitted estimates can be approved');
      }

      // Convert into a quotation. Adjust fields to match your quotations schema.
      const quotation = await this.quotationModel.create(
        {
          projectId: estimate.projectId,
          vendorId: estimate.vendorId,
          tradeTeamId: estimate.tradeTeamId,
          sourceEstimateId: estimate.id,
          category: estimate.category,
          subtotal: estimate.subtotal,
          totalAmount: estimate.totalAmount,
          createdBy: userId ?? null,
        } as any,
        { transaction },
      );

      await estimate.update(
        {
          status: EstimateStatus.CONVERTED,
          convertedQuotationId: quotation.id,
          approvedAt: new Date(),
          approvedBy: userId ?? null,
          updatedBy: userId ?? estimate.updatedBy,
        },
        { transaction },
      );

      return this.findOne(id, transaction);
    });
  }

  async reject(
    id: string,
    dto: RejectEstimateDto,
    userId?: string,
  ): Promise<Estimate> {
    const estimate = await this.findOne(id);
    if (estimate.status !== EstimateStatus.SUBMITTED) {
      throw new ConflictException('Only submitted estimates can be rejected');
    }
    await estimate.update({
      status: EstimateStatus.REJECTED,
      updatedBy: userId ?? estimate.updatedBy,
    });
    if (dto.reason) {
      // Persist reason wherever your audit/notes mechanism lives (not modeled here).
    }
    return this.findOne(id);
  }
}

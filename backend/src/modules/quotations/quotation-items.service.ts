import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';

import { QuotationItem } from './models/quotation-items.model';
import { Unit } from '../metas/models/unit.model';
import {
  CreateQuotationItemDto,
  UpdateQuotationItemDto,
} from './dto/quotation-item.dto';

import { QuotationVersionsService } from './quotation-versions.service';

const computeAmount = (rate: number, quantity: number) =>
  Math.round(rate * quantity * 100) / 100;

@Injectable()
export class QuotationItemsService {
  constructor(
    @InjectModel(QuotationItem)
    private readonly quotationItemModel: typeof QuotationItem,

    private readonly versionsService: QuotationVersionsService,
  ) {}

  async create(
    quotation_id: string,
    dto: CreateQuotationItemDto,
  ): Promise<QuotationItem> {
    try {
      const rate = Number(dto.rate);
      const quantity = Number(dto.quantity);

      const item = await this.quotationItemModel.create({
        ...dto,
        quotation_id,
        amount: dto.amount ?? computeAmount(rate, quantity),
      } as any);

      await this.versionsService.createVersion(
        quotation_id,
        (dto as any).created_by ?? null,
        `Added item #${dto.sno}`,
      );

      return item;
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          `Line item #${dto.sno} already exists on this quotation`,
        );
      }
      throw err;
    }
  }

  findAllForQuotation(quotation_id: string): Promise<QuotationItem[]> {
    return this.quotationItemModel.findAll({
      where: { quotation_id },
      order: [['sno', 'ASC']],
      include: [
        {
          model: Unit,
          required: false,
        },
      ],
    });
  }

  async findOne(id: string): Promise<QuotationItem> {
    const item = await this.quotationItemModel.findByPk(id, {
      include: [Unit],
    });

    if (!item) {
      throw new NotFoundException(`Quotation item ${id} not found`);
    }

    return item;
  }

  async update(
    id: string,
    dto: UpdateQuotationItemDto,
  ): Promise<QuotationItem> {
    const item = await this.findOne(id);

    const rate = dto.rate ?? item.rate;
    const quantity = dto.quantity ?? item.quantity;

    await item.update({
      ...dto,
      amount: dto.amount ?? computeAmount(Number(rate), Number(quantity)),
    });

    await this.versionsService.createVersion(
      item.quotation_id,
      (dto as any).updated_by ?? null,
      `Updated item ${id}`,
    );

    return item;
  }

  /** Replace all items */
  async replaceAllForQuotation(
    quotation_id: string,
    items: CreateQuotationItemDto[],
  ): Promise<QuotationItem[]> {
    await this.quotationItemModel.destroy({ where: { quotation_id } });

    const rows = items.map((item) => {
      const rate = Number(item.rate);
      const quantity = Number(item.quantity);

      return {
        ...item,
        quotation_id,
        amount: item.amount ?? computeAmount(rate, quantity),
      };
    });

    const created = await this.quotationItemModel.bulkCreate(rows as any);

    await this.versionsService.createVersion(
      quotation_id,
      null,
      'Replaced all items',
    );

    return created;
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    const quotationId = item.quotation_id;

    await item.destroy();

    await this.versionsService.createVersion(
      quotationId,
      null,
      `Removed item ${id}`,
    );
  }

  async removeAllForQuotation(quotation_id: string): Promise<void> {
    await this.quotationItemModel.destroy({ where: { quotation_id } });

    await this.versionsService.createVersion(
      quotation_id,
      null,
      'Removed all items',
    );
  }
}

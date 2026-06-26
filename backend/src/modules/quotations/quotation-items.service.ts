import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { QuotationItem } from './models/quotation-items.model';
import {
  CreateQuotationItemDto,
  UpdateQuotationItemDto,
} from './dto/quotation-item.dto';

const computeAmount = (rate: number, quantity: number) =>
  Math.round(rate * quantity * 100) / 100;

@Injectable()
export class QuotationItemsService {
  constructor(
    @InjectModel(QuotationItem)
    private readonly quotationItemModel: typeof QuotationItem,
  ) {}

  async create(
    quotation_id: string,
    dto: CreateQuotationItemDto,
  ): Promise<QuotationItem> {
    try {
      return await this.quotationItemModel.create({
        ...dto,
        quotation_id,
        amount: dto.amount ?? computeAmount(dto.rate, dto.quantity),
      } as any);
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
    });
  }

  async findOne(id: string): Promise<QuotationItem> {
    const item = await this.quotationItemModel.findByPk(id);
    if (!item) throw new NotFoundException(`Quotation item ${id} not found`);
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
    return item;
  }

  /** Replaces every line item for a quotation in one transaction-safe pass. */
  async replaceAllForQuotation(
    quotation_id: string,
    items: CreateQuotationItemDto[],
  ): Promise<QuotationItem[]> {
    await this.quotationItemModel.destroy({ where: { quotation_id } });
    const rows = items.map((item) => ({
      ...item,
      quotation_id,
      amount: item.amount ?? computeAmount(item.rate, item.quantity),
    }));
    return this.quotationItemModel.bulkCreate(rows as any);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await item.destroy();
  }

  async removeAllForQuotation(quotation_id: string): Promise<void> {
    await this.quotationItemModel.destroy({ where: { quotation_id } });
  }
}

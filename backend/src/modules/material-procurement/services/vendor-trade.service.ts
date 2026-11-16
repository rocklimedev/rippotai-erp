import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UniqueConstraintError } from 'sequelize';
import { VendorTrade } from '../models/vendor-trade.model';
import { CreateVendorTradeDto } from '../dto/vendor-trade.dto';

export const vendorTradeKey = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\(\d+\)$/, '')
    .toLowerCase();

@Injectable()
export class VendorTradeService {
  constructor(
    @InjectModel(VendorTrade) private readonly trades: typeof VendorTrade,
  ) {}

  list() {
    return this.trades.findAll({
      attributes: ['id', 'name', 'sort_order'],
      order: [
        ['sort_order', 'ASC'],
        ['name', 'ASC'],
      ],
    });
  }

  async create(dto: CreateVendorTradeDto) {
    const name = dto.name.trim().replace(/\s+/g, ' ');
    const normalized_name = vendorTradeKey(name);
    if (!normalized_name || name.length > 255)
      throw new BadRequestException(
        'Enter a trade name between 1 and 255 characters',
      );
    if (await this.trades.findOne({ where: { normalized_name } }))
      throw new ConflictException(
        'This trade already exists. Select it from the trade catalogue.',
      );
    try {
      return await this.trades.create({
        name,
        normalized_name,
        sort_order: 1000,
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError)
        throw new ConflictException(
          'This trade already exists. Select it from the trade catalogue.',
        );
      throw error;
    }
  }
}

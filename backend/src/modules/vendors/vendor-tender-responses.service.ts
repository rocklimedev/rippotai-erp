import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { VendorTenderResponse } from './models/vendor-tender-response.model';
import { CreateVendorTenderResponseDto } from './dto/create-vendor-tender-response.dto';
import { UpdateVendorTenderResponseDto } from './dto/update-vendor-tender-response.dto';
import { CreateEstimateFromResponseDto } from './dto/create-estimate-from-response.dto';
import { TenderResponseStatus } from '@/common/enums/estimate.enums';
import { EstimatesService } from '../quotations/estimates.service';
import { Estimate } from '../quotations/models/estimate.model';

@Injectable()
export class VendorTenderResponsesService {
  constructor(
    @InjectModel(VendorTenderResponse)
    private readonly responseModel: typeof VendorTenderResponse,
    private readonly estimatesService: EstimatesService,
    private readonly sequelize: Sequelize,
  ) {}

  create(dto: CreateVendorTenderResponseDto): Promise<VendorTenderResponse> {
    return this.responseModel.create({
      ...dto,
      status: TenderResponseStatus.RECEIVED,
    } as any);
  }

  findAll(filters: {
    projectId?: string;
    vendorId?: string;
    status?: TenderResponseStatus;
  }) {
    const where: Record<string, unknown> = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.status) where.status = filters.status;
    return this.responseModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: string): Promise<VendorTenderResponse> {
    const response = await this.responseModel.findByPk(id);
    if (!response) {
      throw new NotFoundException(`Vendor tender response ${id} not found`);
    }
    return response;
  }

  async update(
    id: string,
    dto: UpdateVendorTenderResponseDto,
  ): Promise<VendorTenderResponse> {
    const response = await this.findOne(id);
    await response.update(dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const response = await this.findOne(id);
    await response.destroy();
  }

  /**
   * Reworks a received tender response (rate-only or vendor-quote) into an
   * `estimates` row, then links the response back to that estimate.
   */
  // NOTE: EstimatesService.create() opens its own transaction. For this
  // method to be fully atomic with the response update below, enable
  // Sequelize CLS (Sequelize.useCLS in main.ts) so nested transaction()
  // calls join the outer transaction instead of running independently.
  async reworkIntoEstimate(
    id: string,
    dto: CreateEstimateFromResponseDto,
    userId?: string,
  ): Promise<Estimate> {
    return this.sequelize.transaction(async (transaction) => {
      const response = await this.responseModel.findByPk(id, { transaction });
      if (!response) {
        throw new NotFoundException(`Vendor tender response ${id} not found`);
      }
      if (response.status === TenderResponseStatus.ESTIMATE_CREATED) {
        throw new ConflictException(
          'This response has already been converted into an estimate',
        );
      }

      const estimate = await this.estimatesService.create(
        {
          estimateNumber: dto.estimateNumber,
          projectId: response.projectId,
          vendorId: response.vendorId,
          tradeTeamId: response.tradeTeamId ?? undefined,
          sourcePath: response.responsePath,
          category: dto.category,
          items: dto.items,
        },
        userId,
      );

      await response.update(
        {
          status: TenderResponseStatus.ESTIMATE_CREATED,
          estimateId: estimate.id,
        },
        { transaction },
      );

      return estimate;
    });
  }
}

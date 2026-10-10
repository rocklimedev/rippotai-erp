import { RequirePermission } from '@/common/decorator/require-permission.decorator';
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuotationItemsService } from './quotation-items.service';
import {
  CreateQuotationItemDto,
  UpdateQuotationItemDto,
} from './dto/quotation-item.dto';

@Controller('quotations/:quotationId/items')
export class QuotationItemsController {
  constructor(private readonly quotationItemsService: QuotationItemsService) {}

  @RequirePermission('quotation-items:create')
  @Post()
  create(
    @Param('quotationId') quotationId: string,
    @Body() dto: CreateQuotationItemDto,
  ) {
    return this.quotationItemsService.create(quotationId, dto);
  }

  @RequirePermission('quotation-items:read')
  @Get()
  findAll(@Param('quotationId') quotationId: string) {
    return this.quotationItemsService.findAllForQuotation(quotationId);
  }

  @RequirePermission('quotation-items:update')
  @Put()
  replaceAll(
    @Param('quotationId') quotationId: string,
    @Body() items: CreateQuotationItemDto[],
  ) {
    return this.quotationItemsService.replaceAllForQuotation(
      quotationId,
      items,
    );
  }

  @RequirePermission('quotation-items:update')
  @Patch(':itemId')
  update(@Param('itemId') itemId: string, @Body() dto: UpdateQuotationItemDto) {
    return this.quotationItemsService.update(itemId, dto);
  }

  @RequirePermission('quotation-items:delete')
  @Delete(':itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('itemId') itemId: string) {
    return this.quotationItemsService.remove(itemId);
  }
}

import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SiteStage } from '../../../common/enums/site-stage.enum';

export class CreateDeliveryChallanItemDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderItemId: string;

  @IsNumber()
  @Min(0.001)
  deliveredQuantity: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CreateDeliveryChallanDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderId: string;

  @IsString()
  @IsNotEmpty()
  challanNumber: string;

  @IsDateString()
  deliveryDate: string;

  @IsEnum(SiteStage)
  siteStage: SiteStage;

  @IsOptional()
  @IsString()
  receivedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryChallanItemDto)
  items: CreateDeliveryChallanItemDto[];
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateBudgetEstimateDto } from './create-budget-estimate.dto';

export class UpdateBudgetEstimateDto extends PartialType(
  CreateBudgetEstimateDto,
) {}

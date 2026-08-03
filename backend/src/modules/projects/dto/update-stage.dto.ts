import { PartialType } from '@nestjs/mapped-types';
import { CreateExecutionStageDto } from './create-stage.dto';

export class UpdateExecutionStageDto extends PartialType(
  CreateExecutionStageDto,
) {}

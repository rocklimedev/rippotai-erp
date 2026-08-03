import { PartialType } from '@nestjs/mapped-types';
import { CreateExecutionActivityDto } from './create-activity.dto';

export class UpdateExecutionActivityDto extends PartialType(
  CreateExecutionActivityDto,
) {}

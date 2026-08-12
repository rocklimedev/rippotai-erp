import { PartialType } from '@nestjs/mapped-types';
import { CreateDesignClarificationDto } from './create-design-clarification.dto';

export class UpdateDesignClarificationDto extends PartialType(
  CreateDesignClarificationDto,
) {}

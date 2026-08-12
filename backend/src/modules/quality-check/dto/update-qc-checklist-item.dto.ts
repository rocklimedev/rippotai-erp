import { PartialType } from '@nestjs/mapped-types';
import { CreateQcChecklistItemDto } from './create-qc-checklist-item.dto';

export class UpdateQcChecklistItemDto extends PartialType(
  CreateQcChecklistItemDto,
) {}

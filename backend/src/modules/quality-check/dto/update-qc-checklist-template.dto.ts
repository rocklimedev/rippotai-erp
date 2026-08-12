import { PartialType } from '@nestjs/mapped-types';
import { CreateQcChecklistTemplateDto } from './create-qc-checklist-template.dto';

export class UpdateQcChecklistTemplateDto extends PartialType(
  CreateQcChecklistTemplateDto,
) {}

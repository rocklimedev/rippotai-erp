import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectHandoverDto } from './create-project-handover.dto';

export class UpdateProjectHandoverDto extends PartialType(
  CreateProjectHandoverDto,
) {}

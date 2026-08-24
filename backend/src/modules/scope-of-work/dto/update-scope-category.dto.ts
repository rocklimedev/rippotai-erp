import { PartialType } from '@nestjs/mapped-types';
import { CreateScopeCategoryDto } from './create-scope-category.dto';

export class UpdateScopeCategoryDto extends PartialType(
  CreateScopeCategoryDto,
) {}

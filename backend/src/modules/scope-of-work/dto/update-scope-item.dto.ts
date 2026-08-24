import { PartialType } from '@nestjs/mapped-types';
import { CreateScopeItemDto } from './create-scope-item.dto';

export class UpdateScopeItemDto extends PartialType(CreateScopeItemDto) {}

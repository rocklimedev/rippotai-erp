import { PartialType } from '@nestjs/mapped-types';
import { CreateScopeOfWorkDto } from './create-scope-of-work.dto';

export class UpdateScopeOfWorkDto extends PartialType(CreateScopeOfWorkDto) {}

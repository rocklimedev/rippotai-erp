// dto/update-boq-miscellaneous.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBoqMiscellaneousDto } from './create-boq-miscellaneous.dto';

export class UpdateBoqMiscellaneousDto extends PartialType(
  CreateBoqMiscellaneousDto,
) {}

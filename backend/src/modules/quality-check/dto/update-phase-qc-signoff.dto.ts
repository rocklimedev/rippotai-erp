import { PartialType } from '@nestjs/mapped-types';
import { CreatePhaseQcSignoffDto } from './create-phase-qc-signoff.dto';

export class UpdatePhaseQcSignoffDto extends PartialType(
  CreatePhaseQcSignoffDto,
) {}

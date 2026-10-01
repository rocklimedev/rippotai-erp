import { PartialType } from '@nestjs/mapped-types';

import { CreateMaterialProcurementDto } from './create-material-procurement.dto';

export class UpdateMaterialProcurementDto extends PartialType(
  CreateMaterialProcurementDto,
) {}

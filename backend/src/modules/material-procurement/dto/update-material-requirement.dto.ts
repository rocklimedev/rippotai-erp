import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialRequirementDto } from './create-material-requirement.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { RequirementStatus } from '../../../common/enums/requirement-status.enum';

export class UpdateMaterialRequirementDto extends PartialType(
  CreateMaterialRequirementDto,
) {
  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;
}

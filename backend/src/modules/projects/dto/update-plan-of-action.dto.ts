import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePlanOfActionDto } from './create-plan-of-action.dto';

export class UpdatePlanOfActionDto extends PartialType(
  OmitType(CreatePlanOfActionDto, [
    'project_id',
    'phases',
    'team_members',
  ] as const),
) {}

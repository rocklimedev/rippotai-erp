import { PartialType } from '@nestjs/mapped-types';
import { CreateContractorLineupDto } from './create-contractor-lineup.dto';

export class UpdateContractorLineupDto extends PartialType(CreateContractorLineupDto) {}

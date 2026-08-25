import { PartialType } from '@nestjs/mapped-types';
import { CreateSiteRecceRoomDto } from './create-site-recce-room.dto';

export class UpdateSiteRecceRoomDto extends PartialType(
  CreateSiteRecceRoomDto,
) {}

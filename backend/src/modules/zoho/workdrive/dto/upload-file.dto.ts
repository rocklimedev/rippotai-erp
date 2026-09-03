import { IsBooleanString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  ownerKey: string;

  @IsString()
  @IsNotEmpty()
  parentId: string;

  @IsOptional()
  @IsBooleanString()
  overrideNameExist?: string;
}

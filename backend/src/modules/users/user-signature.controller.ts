import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserSignaturesService } from './user-signature.service';
import { CdnGuard } from '@/common/guards/cdn.guard';

@Controller('user-signatures')
export class UserSignatureController {
  constructor(private readonly signatureService: UserSignaturesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('signature'))
  async uploadSignature(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Signature file is required');
    }

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    return this.signatureService.createOrUpdate(
      userId,
      file,
      userId, // createdBy/updatedBy
    );
  }

  @Get(':userId')
  @UseGuards(CdnGuard)
  async getSignature(@Param('userId') userId: string) {
    return this.signatureService.findByUserId(userId);
  }

  @Delete(':userId')
  @UseGuards(CdnGuard)
  async deleteSignature(@Param('userId') userId: string) {
    await this.signatureService.remove(userId);
    return { message: 'Signature deleted successfully' };
  }
}

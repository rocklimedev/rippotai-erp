import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserSignature } from './models/user-signature.model';
import { CdnService } from '../cdn/cdn.service';

@Injectable()
export class UserSignaturesService {
  constructor(
    @InjectModel(UserSignature)
    private readonly userSignatureModel: typeof UserSignature,
    private readonly cdnService: CdnService,
  ) {}

  async uploadToCDN(
    file: Express.Multer.File,
    _userId: string,
  ): Promise<string> {
    const upload = await this.cdnService.uploadFile(file, 'signatures');
    return upload.url;
  }

  async createOrUpdate(
    userId: string,
    file: Express.Multer.File,
    createdBy?: string,
  ): Promise<UserSignature> {
    const signatureUrl = await this.uploadToCDN(file, userId);

    const existing = await this.userSignatureModel.findOne({
      where: {
        user_id: userId,
      },
    });

    if (existing) {
      await existing.update({
        signature_url: signatureUrl,
        signature_file_name: file.originalname,
        signature_file_type: file.mimetype,
        signature_file_size: file.size,
        is_active: true,
        created_by: createdBy ?? existing.created_by,
      });

      return existing;
    }

    return this.userSignatureModel.create({
      user_id: userId,
      signature_url: signatureUrl,
      signature_file_name: file.originalname,
      signature_file_type: file.mimetype,
      signature_file_size: file.size,
      is_active: true,
      created_by: createdBy,
    });
  }

  async findByUserId(userId: string): Promise<UserSignature> {
    const signature = await this.userSignatureModel.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found for this user');
    }

    return signature;
  }

  async deactivate(userId: string): Promise<void> {
    const signature = await this.userSignatureModel.findOne({
      where: {
        user_id: userId,
      },
    });

    if (!signature) {
      throw new NotFoundException('Signature not found.');
    }

    await signature.update({
      is_active: false,
    });
  }

  async remove(userId: string): Promise<void> {
    const deleted = await this.userSignatureModel.destroy({
      where: {
        user_id: userId,
      },
    });

    if (!deleted) {
      throw new NotFoundException('Signature not found.');
    }
  }
}

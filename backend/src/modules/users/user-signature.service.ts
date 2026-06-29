import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserSignature } from './models/user-signature.model';
import Client from 'ssh2-sftp-client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UserSignaturesService {
  private readonly sftp = new Client();

  constructor(
    @InjectModel(UserSignature)
    private readonly userSignatureModel: typeof UserSignature,
  ) {}

  async uploadToCDN(
    file: Express.Multer.File,
    userId: string,
  ): Promise<string> {
    const fileExt = path.extname(file.originalname);
    const fileName = `${userId}-signature-${uuidv4()}${fileExt}`;
    const remotePath = `${process.env.CDN_UPLOAD_PATH}/${fileName}`;

    try {
      await this.sftp.connect({
        host: process.env.CDN_HOST,
        port: Number(process.env.CDN_PORT ?? 22),
        username: process.env.CDN_USERNAME,
        password: process.env.CDN_PASSWORD,
      });

      await this.sftp.put(file.buffer, remotePath);

      return `${process.env.CDN_BASE_URL}/${fileName}`;
    } catch (error) {
      console.error('CDN Upload Error:', error);
      throw new BadRequestException('Failed to upload signature to CDN');
    } finally {
      await this.sftp.end();
    }
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

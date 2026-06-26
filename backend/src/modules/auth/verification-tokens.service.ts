import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { VerificationToken } from './models/verification-token.model';
import { CreateVerificationTokenDto } from './dto/verification-token.dto';

@Injectable()
export class VerificationTokensService {
  constructor(
    @InjectModel(VerificationToken)
    private readonly verificationTokenModel: typeof VerificationToken,
  ) {}

  create(dto: CreateVerificationTokenDto): Promise<VerificationToken> {
    return this.verificationTokenModel.create({ ...dto } as any);
  }

  findValidByToken(token: string): Promise<VerificationToken | null> {
    return this.verificationTokenModel.findOne({
      where: {
        token,
        used_at: { [Op.is]: null },
        expires_at: { [Op.gt]: new Date() },
      },
    });
  }

  async consume(id: string): Promise<VerificationToken> {
    const token = await this.verificationTokenModel.findByPk(id);
    if (!token)
      throw new NotFoundException(`Verification token ${id} not found`);
    if (token.used_at)
      throw new BadRequestException('Token has already been used');
    if (token.expires_at < new Date())
      throw new BadRequestException('Token has expired');
    await token.update({ used_at: new Date() });
    return token;
  }

  async remove(id: string): Promise<void> {
    const token = await this.verificationTokenModel.findByPk(id);
    if (!token)
      throw new NotFoundException(`Verification token ${id} not found`);
    await token.destroy();
  }
}

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { User } from './models/user.model';
import { UserSignature } from './models/user-signature.model'; // ← Add this

// Services
import { UsersService } from './users.service';
import { UserSignaturesService } from './user-signature.service';
// Controllers
import { UsersController } from './users.controller';
import { UserSignatureController } from './user-signature.controller'; // ← Add this

@Module({
  imports: [
    SequelizeModule.forFeature([User, UserSignature]), // ← Added UserSignature
  ],
  controllers: [
    UsersController,
    UserSignatureController, // ← Added here
  ],
  providers: [
    UsersService,
    UserSignaturesService, // ← Added here
  ],
  exports: [
    UsersService,
    UserSignaturesService, // ← Recommended to export
  ],
})
export class UsersModule {}

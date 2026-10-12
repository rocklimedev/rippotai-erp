import { Global, Module } from '@nestjs/common';
import { SharedProjectDataController } from './shared-project-data.controller';
import { SharedProjectDataService } from './shared-project-data.service';

@Global()
@Module({ controllers: [SharedProjectDataController], providers: [SharedProjectDataService], exports: [SharedProjectDataService] })
export class SharedProjectDataModule {}

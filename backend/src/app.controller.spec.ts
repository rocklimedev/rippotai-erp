import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns API service status', () => {
      expect(appController.getHello()).toEqual({
        success: true,
        message: 'Rippotai ERP API is running',
        service: 'rippotai-erp-api',
        timestamp: expect.any(String),
      });
    });
  });
});

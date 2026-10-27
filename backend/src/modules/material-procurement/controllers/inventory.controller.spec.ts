import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '@/common/guards/jwt-auth-guard';
import { InventoryController } from './inventory.controller';
import { InventoryService } from '../services/inventory.service';

describe('Inventory manual receipt route', () => {
  let app: INestApplication;
  const receive = jest.fn(async (dto) => ({ id: 'receipt', ...dto }));

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [{ provide: InventoryService, useValue: { receive } }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => { await app?.close(); });

  it.each([0, 5])('accepts quantity %s without a transaction_type', async (quantity) => {
    const body = {
      project_id: '123e4567-e89b-42d3-a456-426614174000',
      material_id: '123e4567-e89b-42d3-a456-426614174001',
      transaction_date: '2026-10-26',
      quantity,
    };
    await request(app.getHttpServer())
      .post('/api/v1/inventory/receive')
      .send(body)
      .expect(201)
      .expect({ id: 'receipt', ...body });
    expect(receive).toHaveBeenLastCalledWith(body, undefined);
  });
});

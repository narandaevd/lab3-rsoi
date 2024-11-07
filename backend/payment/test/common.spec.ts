import { NotFoundException } from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment } from 'entities/payment.entity';
import { mock } from 'jest-mock-extended';
import { PaymentService } from 'services/payment.service';
import { Repository } from 'typeorm';

describe('Loyalty', () => {

  let module: TestingModule;
  let service: PaymentService;
  const mockedPaymentRepo = mock<Repository<Payment>>({
    findOneBy: jest.fn(),
  } as unknown as Repository<Payment>);

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: mockedPaymentRepo,
        },
      ]
    }).compile();
    service = module.get(PaymentService);
  });

  it('getByUid success', async () => {
    const uid = 'someuid';
    mockedPaymentRepo.findOneBy.mockResolvedValueOnce({} as Payment);
    const result = await service.getByUid(uid);

    expect(result).toBeDefined();
  });
  it('getByUid notfound', async () => {
    const uid = 'someuid';
    mockedPaymentRepo.findOneBy.mockResolvedValueOnce(null);

    expect(() => service.getByUid(uid)).rejects.toThrow(NotFoundException);
  });
});

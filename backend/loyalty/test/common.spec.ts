import { NotFoundException } from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateLoyaltyDto } from 'dtos';
import { Loyalty } from 'entities/loyalty.entity';
import { mock } from 'jest-mock-extended';
import { LoyaltyService } from 'services/loyalty.service';
import { Repository } from 'typeorm';

describe('Loyalty', () => {

  let module: TestingModule;
  let service: LoyaltyService;
  const mockedLoyaltyRepo = mock<Repository<Loyalty>>({
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  } as unknown as Repository<Loyalty>);

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        LoyaltyService,
        {
          provide: getRepositoryToken(Loyalty),
          useValue: mockedLoyaltyRepo,
        },
      ]
    }).compile();
    service = module.get(LoyaltyService);
  });

  it('getLoyaltyByUsername success', async () => {
    const name = 'somename';
    mockedLoyaltyRepo.findOne.mockResolvedValueOnce({} as Loyalty);
    const result = await service.getLoyaltyByUsername(name);

    expect(result).toBeDefined();
  });
  it('getLoyaltyByUsername notfound', async () => {
    const name = 'somename';
    mockedLoyaltyRepo.findOne.mockResolvedValueOnce(null);

    expect(() => service.getLoyaltyByUsername(name)).rejects.toThrow(NotFoundException);
  });
  it('createLoyalty notfound', async () => {
    mockedLoyaltyRepo.create.mockReturnValueOnce({} as Loyalty);
    mockedLoyaltyRepo.save.mockResolvedValueOnce({} as Loyalty);

    const result = await service.createLoyalty({} as CreateLoyaltyDto);

    expect(result).toBeDefined();
  });
});

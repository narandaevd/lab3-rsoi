import { NotFoundException } from '@nestjs/common';
import {Test, TestingModule} from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Hotel } from 'entities/hotels.entity';
import { Reservation } from 'entities/reservation.entity';
import { mock } from 'jest-mock-extended';
import { ReservationService } from 'services/reservation.service';
import { Repository } from 'typeorm';

describe('Reservation', () => {

  let module: TestingModule;
  let service: ReservationService;
  const mockedReservationRepo = mock<Repository<Reservation>>({} as unknown as Repository<Reservation>);
  const mockedHotelRepo = mock<Repository<Hotel>>({
    findOneBy: jest.fn(),  
  } as unknown as Repository<Hotel>);

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Hotel),
          useValue: mockedHotelRepo,
        },
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockedReservationRepo,
        },
      ]
    }).compile();
    service = module.get(ReservationService);
  });

  it('getHotelByUid success', async () => {
    const uid = 'someuid';
    mockedHotelRepo.findOneBy.mockResolvedValueOnce({} as Hotel);
    const result = await service.getHotelByUid(uid);

    expect(result).toBeDefined();
  });
  it('getHotelByUid notfound', async () => {
    const uid = 'someuid';
    mockedHotelRepo.findOneBy.mockResolvedValueOnce(null);

    expect(() => service.getHotelByUid(uid)).rejects.toThrow(NotFoundException);
  });
});

import {Test, TestingModule} from '@nestjs/testing';
import { AxiosInstance } from 'axios';
import { GatewayService } from 'common/services/gateway.service';
import { mock } from 'jest-mock-extended';

describe('ApiGateway', () => {

  let module: TestingModule;
  let service: GatewayService;
  const mockedReservationAdapter = mock<AxiosInstance>({
    get: jest.fn(),
  } as unknown as AxiosInstance);
  const mockedLoyaltyAdapter = mock<AxiosInstance>({
    get: jest.fn(),
  } as unknown as AxiosInstance);
  const mockedPaymentAdapter = mock<AxiosInstance>({} as unknown as AxiosInstance);

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        GatewayService,
        {
          provide: 'RESERVATION_ADAPTER',
          useValue: mockedReservationAdapter,
        },
        {
          provide: 'LOYALTY_ADAPTER',
          useValue: mockedLoyaltyAdapter,
        },
        {
          provide: 'PAYMENT_ADAPTER',
          useValue: mockedPaymentAdapter,
        },
      ]
    }).compile();
    service = module.get(GatewayService);
  });

  it('getHotels empty', async () => {
    const page = 0;
    const size = 0;
    mockedReservationAdapter.get.mockResolvedValueOnce({
      data: {
        items: [],
      }
    });
    const result = await service.getHotels({page, size});

    expect(result).toBeDefined();
    expect(result.items).toBeDefined();
    expect(result.items.length).toBe(0);
  });

  it('getHotels nonempty', async () => {
    const page = 0;
    const size = 0;
    mockedReservationAdapter.get.mockResolvedValueOnce({
      data: {
        items: [{}, {}],
      }
    });
    const result = await service.getHotels({page, size});

    expect(result).toBeDefined();
    expect(result.items).toBeDefined();
    expect(result.items.length).toBe(2);
  });

  it('getLoyalty found', async () => {
    const name = 'somename';
    mockedLoyaltyAdapter.get.mockResolvedValue({
      data: {
        username: name,
      }
    });
    const result = await service.getLoyalty(name);

    expect(result).toBeDefined();
    expect(result.username).toBeDefined();
    expect(result.username).toBe(name);
  });
});

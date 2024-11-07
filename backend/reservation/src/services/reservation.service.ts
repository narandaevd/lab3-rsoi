import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Reservation } from "../entities/reservation.entity";
import { CreateHotelDto, CreateReservationDto, GetHotelsDto, Status } from "../dtos";
import { Hotel } from "entities/hotels.entity";
import { Pagination } from "common/pagination";

@Injectable()
export class ReservationService {
  public constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(Hotel)
    private hotelRepo: Repository<Hotel>,
  ) {}

  async createReservation(dto: CreateReservationDto) {
    const hotel = await this.hotelRepo.findOneBy({hotelUid: dto.hotelUid});
    if (!hotel)
      throw new BadRequestException('Нет такого hotel');
    return await this.reservationRepo.save(this.reservationRepo.create({
      ...dto,
      hotelId: hotel.id,
    }));
  }

  async getUserReservations(username: string) {
    const reservs = await this.reservationRepo.find({
      where: {username},
    });
    if (reservs.length === 0)
      return [];
    const hotels = await this.hotelRepo.find({
      where: {
        id: In(reservs.map(res => res.hotelId))
      },
    });
    reservs.forEach(res => {
      res.hotel = hotels.find(h => h.id === res.hotelId);
    });
    return reservs;
  }

  async getUserReservationByUid(uid: string, username: string) {
    const reservation = await this.reservationRepo.findOne({
      where: {reservationUid: uid, username},
    });
    if (!reservation)
      throw new NotFoundException();
    const hotel = await this.hotelRepo.findOneBy({
      id: reservation.hotelId,
    });
    reservation.hotel = hotel;
    return reservation;
  }

  async deleteUserReservationByUid(uid: string, username: string) {
    const reservation = await this.getUserReservationByUid(uid, username);
    reservation.status = Status.CANCELED;
    await this.reservationRepo.save(reservation);
  }

  async getHotelPagination(dto: GetHotelsDto) {
    const [items, amount] = await this.hotelRepo.findAndCount({
      skip: (dto.page - 1) * dto.size,
      take: dto.size,
    });
    return new Pagination(items, dto.page, dto.size, amount);
  }

  async getHotelByUid(uid: string) {
    const maybeHotel = await this.hotelRepo.findOneBy({hotelUid: uid});
    if (!maybeHotel)
      throw new NotFoundException(`Нет hotel с uid ${uid}`);
    return maybeHotel
  }

  async createHotel(dto: CreateHotelDto) {
    return await this.hotelRepo.save(this.hotelRepo.create(dto));
  }
}

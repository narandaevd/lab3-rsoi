import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Reservation } from "./reservation.entity";

@Entity({name: 'hotels'})
@Unique('AAAAid', ['id'])
export class Hotel {

  @PrimaryGeneratedColumn()
  declare id: number;
  
  @PrimaryGeneratedColumn('uuid')
  declare hotelUid: string;
  
  @Column({type: 'text'})
  declare name: string;
  
  @Column({type: 'text'})
  declare country: string;

  @Column({type: 'text'})
  declare city: string;

  @Column({type: 'text'})
  declare address: string;

  @Column({type: 'int', nullable: true})
  declare stars: number | null;

  @Column({type: 'int'})
  declare price: number;

  @OneToMany(() => Reservation, reservation => reservation.hotel)
  declare reservation: Reservation;
}

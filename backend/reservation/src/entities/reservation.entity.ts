import { Check, Column, Entity, JoinColumn, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Status } from "../dtos";
import { Hotel } from "./hotels.entity";
import { Transform } from "class-transformer";

@Entity({name: 'reservation'})
@Check(`"status" IN ('PAID', 'CANCELED', 'REVERSED')`)
export class Reservation {

  @PrimaryGeneratedColumn()
  declare id: number;
  
  @PrimaryGeneratedColumn('uuid')
  declare reservationUid: string;
  
  @Column({type: 'text'})
  declare username: string;
  
  @Column({type: 'uuid'})
  declare paymentUid: string;

  @Column({type: 'integer'})
  declare hotelId: number;

  @ManyToOne(() => Hotel)
  @JoinColumn({referencedColumnName: 'id', name: 'hotelId'})
  declare hotel: Hotel;

  @Column({type: 'text'})
  declare status: Status;

  @Transform(({value}) => new Date(value).toISOString().slice(0, 10), {toPlainOnly: true})
  @Column({
    type: 'timestamp with time zone',
  })
  startDate: Date;

  @Transform(({value}) => new Date(value).toISOString().slice(0, 10), {toPlainOnly: true})
  @Column({
    type: 'timestamp with time zone',
  })
  endDate: Date;
}

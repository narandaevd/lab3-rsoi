import { Status } from "dtos";
import { Check, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({name: 'payment'})
@Check(`"status" IN ('PAID', 'CANCELED')`)
export class Payment {

  @PrimaryGeneratedColumn()
  declare id: number;
  
  @PrimaryGeneratedColumn('uuid')
  declare paymentUid: string;
  
  @Column({type: 'text'})
  status: Status;

  @Column({type: 'integer'})
  price: number;
}

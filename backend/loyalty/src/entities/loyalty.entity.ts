import { Status } from "dtos";
import { Check, Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Check(`"status" IN ('BRONZE', 'SILVER', 'GOLD')`)
@Entity({name: 'loyalty'})
export class Loyalty {

  @PrimaryGeneratedColumn()
  declare id: number;
  
  @Column({type: 'text', unique: true})
  declare username: string;
  
  @Column({type: 'int', default: 0})
  declare reservationCount: number;

  @Column({type: 'text', default: Status.BRONZE})
  status: Status;

  @Column({type: 'integer'})
  discount: number;
}

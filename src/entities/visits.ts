import { Field, ID, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Link } from './link';

@ObjectType()
@Entity('hits')
export class Hit extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: string;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @ManyToOne(() => Link, (link) => link.hits, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  link: Link;
}

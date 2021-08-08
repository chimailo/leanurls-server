import { Field, ID, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Link } from './link';

@ObjectType()
@Entity('users')
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryColumn()
  id: string;

  @Field()
  @Column({ length: 128, nullable: true })
  name: string;

  @Field()
  @Column({ length: 150, unique: true, nullable: true })
  email: string;

  @Field()
  @Column({ nullable: true })
  avatar: string;

  @Field()
  @Column({ default: false })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Link, (link) => link.user)
  links: Link[];
}

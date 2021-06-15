import gravatar from 'gravatar'
import { IsEmail, Length, MaxLength } from 'class-validator';
import {
  Arg,
  Ctx,
  InputType,
  Mutation,
  Resolver,
  Query,
  Field,
  UseMiddleware,
} from 'type-graphql';
import { getConnection } from 'typeorm';
import { isAuth } from '../middlewares/isAuth';
import { MyContext } from '../types';
import { User } from '../entities/user';

@InputType()
class RegisterInput {
  @Field()
  @Length(2, 128)
  name: string;

  @Field()
  @MaxLength(255, {
    message: 'Email length must not be more than 255 characters',
  })
  @IsEmail()
  email: string;
}

@Resolver()
export class UserResolver {
  @Query(() => [User], { nullable: true })
  async users(): Promise<User[]> {
    return User.find()
  }

  @UseMiddleware(isAuth)
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    console.log('made request')
    return User.findOne({ id: req.payload.user_id })
  }

  @UseMiddleware(isAuth)
  @Mutation(() => User, { nullable: true })
  async createUser(
    @Arg('data') data: RegisterInput,
    @Ctx() { req }: MyContext,
  ): Promise<User | null> {
    const { name, email } = data;

    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm',
    })

    let user: User;

    try {
      const query = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          id: req.payload.uid,
          name,
          email,
          avatar: req.payload.picture ? req.payload.picture : avatar
        })
        .returning('*')
        .execute();

      user = query.raw[0];
      // user = User.create({
      //   id: req.payload.uid,
      //   name,
      //   email,
      //   avatar: req.payload.picture ? req.payload.picture : avatar
      // }).save();
    } catch (err) {
      console.error(err);
      return null;
    }

    return user;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => User, { nullable: true })
  async updateUser(
    @Arg('id') id: String,
    @Arg('data') data: RegisterInput,
  ): Promise<User | null> {
    const { name, email } = data;

    let user: User;

    try {
      const query = await getConnection()
      .createQueryBuilder()
      .update(User)
      .set({ name, email })
      .where("id = :id", { id })
      .returning('*')
      .execute();

      user = query.raw[0];
    } catch (err) {
      console.error(err);
      return null;
    }

    return user;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async deleteUser(@Arg('id') id: String): Promise<Boolean> {
    try {
      await getConnection()
      .createQueryBuilder()
      .delete()
      .from(User)
      .where("id = :id", { id })
      .execute();
    } catch (err) {
      console.error(err);
      throw new Error(err)
    }

    return true;
  }
}

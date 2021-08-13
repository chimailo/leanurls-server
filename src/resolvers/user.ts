import gravatar from 'gravatar';
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
class SignupInput {
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
    return User.find();
  }

  @UseMiddleware(isAuth)
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: MyContext): Promise<User | undefined> {
    return User.findOne({ id: req.payload.user_id });
  }

  @UseMiddleware(isAuth)
  @Mutation(() => User)
  async createUser(
    @Arg('values') values: SignupInput,
    @Ctx() { req }: MyContext
  ): Promise<User> {
    const { name, email } = values;

    let user = await User.findOne({ id: req.payload.user_id });
    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm',
    });

    try {
      if (user) {
        user.name = name;
        user.email = email;
        user.avatar = avatar;
        user.isActive = true;
        await user.save();
      } else {
        user = await User.create({
          id: req.payload.user_id,
          name,
          email,
          avatar: req.payload.picture ? req.payload.picture : avatar,
          isActive: true,
        }).save();
      }
    } catch (err) {
      console.error(err);
      throw new Error('An unexpected error has ocurred, please try again.');
    }

    return user;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => User, { nullable: true })
  async updateUser(
    @Arg('key') key: string,
    @Arg('value') value: string,
    @Ctx() { req }: MyContext
  ): Promise<User | null> {
    let user: User;

    try {
      const query = await getConnection()
        .createQueryBuilder()
        .update(User)
        .set({ [key]: value })
        .where('id = :id', { id: req.payload.user_id })
        .returning('*')
        .execute();

      user = query.raw[0];
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
    return user;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async deleteUser(@Ctx() { req }: MyContext): Promise<Boolean> {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('id = :id', { id: req.payload.user_id })
        .execute();
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
    return true;
  }
}

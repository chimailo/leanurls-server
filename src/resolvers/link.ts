import { MaxLength, IsUrl } from 'class-validator';
import {
  Arg,
  Ctx,
  InputType,
  Mutation,
  Resolver,
  Query,
  Field,
  UseMiddleware,
  ObjectType,
  Int,
} from 'type-graphql';
import { Hit } from '../entities/visits';
import { IsAliasAlreadyTaken } from './validators/uniqueAlias';
import { isAuth } from '../middlewares/isAuth';
import { Link } from '../entities/link';
import { MyContext } from '../types';
import { User } from '../entities/user';
import { getConnection } from 'typeorm';

type FilterField = 'createdAt' | 'lastHit';

const getUrlIdentifier = (url: string) => {
  const splitUrl = url.split('/');
  return splitUrl[splitUrl.length - 1];
};

@InputType()
class CreateLinkInput {
  @Field()
  @IsUrl()
  link: string;

  @Field({ nullable: true })
  @MaxLength(32)
  @IsAliasAlreadyTaken()
  alias: string;
}

@InputType()
class FilterInput {
  @Field({ defaultValue: 'createdAt' })
  field: FilterField;

  @Field({ nullable: true })
  from: string;

  @Field({ nullable: true })
  to: string;
}

@ObjectType()
class ChartData {
  @Field()
  alias: string;

  @Field()
  hits: number;
}

@ObjectType()
class TableData extends Link {
  @Field({ nullable: true })
  numberOfHits: string;

  @Field({ nullable: true })
  lastHit: Date;
}

@Resolver()
export class LinkResolver {
  @Query(() => String, { nullable: true })
  async getLink(@Arg('url') leanurl: string): Promise<string | null> {
    const identifier = getUrlIdentifier(leanurl);
    const link = await Link.findOne({ where: { alias: identifier } });

    if (!link) return null;

    const hit = Hit.create({ link });
    await hit.save();

    return link.link;
  }

  @UseMiddleware(isAuth)
  @Query(() => Number)
  async getMyLinksCount(@Ctx() { req }: MyContext): Promise<number> {
    return Link.count({ where: { user: req.payload.user_id } });
  }

  @UseMiddleware(isAuth)
  @Query(() => Number)
  async getMyHitsCount(@Ctx() { req }: MyContext): Promise<number> {
    let count;
    try {
      count = await Hit.createQueryBuilder('hit')
        .leftJoinAndSelect('hit.link', 'link')
        .where('link.user = :id', { id: req.payload.user_id })
        .getCount();
    } catch (error) {
      console.log(error);
      throw new Error('Internal server error');
    }
    return count;
  }

  @UseMiddleware(isAuth)
  @Query(() => Date, { nullable: true })
  async getMyLastHitTime(@Ctx() { req }: MyContext): Promise<Date | null> {
    let timestamp;
    try {
      timestamp = await Hit.createQueryBuilder('hit')
        .select('MAX(hit.createdAt)', 'latest')
        .leftJoin('hit.link', 'link')
        .groupBy('link.user')
        .where('link.user = :id', { id: req.payload.user_id })
        .getRawOne<{ latest: Date }>();
    } catch (error) {
      console.log(error);
      throw new Error('Internal server error');
    }

    if (!timestamp) return null;
    return timestamp.latest;
  }

  @UseMiddleware(isAuth)
  @Query(() => [ChartData])
  async getChartData(
    @Ctx() { req }: MyContext
  ): Promise<{ alias: string; hits: number }[]> {
    let chartData;

    try {
      chartData = await Hit.createQueryBuilder('hit')
        .select('COUNT(hit.link)', 'hits')
        .addSelect('link.alias', 'alias')
        .leftJoin('hit.link', 'link')
        .groupBy('link.alias')
        .where('link.user = :id', { id: req.payload.user_id })
        .getRawMany<{ alias: string; hits: number }>();
    } catch (error) {
      console.log(error);
      throw new Error('Internal server error');
    }
    return chartData;
  }

  @UseMiddleware(isAuth)
  @Query(() => [TableData])
  async getTableData(
    @Arg('limit', () => Int) limit: number,
    @Arg('offset', () => Int, { defaultValue: 0 }) offset: number,
    @Arg('filter', { nullable: true }) filter: FilterInput,
    @Ctx() { req }: MyContext
  ): Promise<TableData[]> {
    let res;
    try {
      res = Link.createQueryBuilder('link')
        .select('link.*')
        .addSelect('COUNT(link.id)', 'numberOfHits')
        .addSelect('MAX(hit.createdAt)', 'lastHit')
        .leftJoin('link.hits', 'hit')
        .groupBy('link.id')
        .where('link.user = :id', { id: req.payload.user_id });
    } catch (error) {
      console.log(error);
      throw new Error('Internal server error');
    }

    if (filter) {
      res
        .where(`"link"."${filter.field}" > :from`, { from: filter.from })
        .andWhere(`"link"."${filter.field}" < :to`, { to: filter.to });
    }

    return res
      .orderBy('"createdAt"', 'DESC')
      .limit(limit)
      .offset(offset)
      .getRawMany();
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Link!)
  async createLink(
    @Arg('values') values: CreateLinkInput,
    @Ctx() { req }: MyContext
  ): Promise<Link> {
    const { link, alias } = values;
    console.log(req.payload);
    let user = await User.findOne({ id: req.payload.user_id });

    if (!user) {
      user = await User.create({ id: req.payload.user_id }).save();
    }

    const newLink = await Link.create({
      alias: alias ? alias : Math.random().toString(36).slice(2, 10),
      link,
      user,
    }).save();

    // return process.env.HOST_URL + newLink.alias;
    return newLink;
  }

  @UseMiddleware(isAuth)
  @Mutation(() => Boolean)
  async deleteLink(
    @Arg('id', () => String) id: string,
    @Ctx() { req }: MyContext
  ): Promise<Boolean> {
    try {
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(Link)
        .where('userId = :userId', { userId: req.payload.user_id })
        .andWhere('id = :id', { id: id })
        .execute();
    } catch (err) {
      throw new Error(err);
    }
    return true;
  }
}

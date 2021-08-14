import path from 'path';
import 'reflect-metadata';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { Hit } from './entities/visits';
import { Link } from './entities/link';
import { LinkResolver } from './resolvers/link';
import { User } from './entities/user';
import { UserResolver } from './resolvers/user';

dotenv.config({
  path: path.join(__dirname, '../', `.env.${process.env.NODE_ENV}`),
});

const PORT = 8000;
const HOST = `http://localhost:${PORT}`;

async function main() {
  try {
    await createConnection({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      cache: true,
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production',
      entities: [Link, User, Hit],
    });

    const app = express();

    app.use(
      cors({
        credentials: true,
        // origin: `http://localhost:3000`,
        origin: process.env.HOST_URL,
      })
    );

    const apolloServer = new ApolloServer({
      schema: await buildSchema({
        resolvers: [LinkResolver, UserResolver],
      }),
      context: ({ req, res }) => ({ req, res }),
    });

    apolloServer.applyMiddleware({
      app,
      cors: false,
    });

    // Start the server
    app.listen(PORT, () =>
      console.log(
        `Server is running, GraphQL Playground available at ${HOST}/graphql`
      )
    );
  } catch (err) {
    console.error(err);
  }
}

main();

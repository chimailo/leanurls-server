import path from 'path';
import 'reflect-metadata';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { createConnection } from 'typeorm';
import { User } from './entities/user';
import { UserResolver } from './resolvers/user';

dotenv.config({
  path: path.join(__dirname, '../', `.env.${process.env.NODE_ENV}`),
});
  
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'http://localhost';

async function main() {
    try {
      await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: process.env.DB_PORT as unknown as number,
        database: process.env.DB_NAME,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        synchronize: true,
        logging: true,
        cache: true,
        entities: [User],
      });
  
      const app = express();
  
      app.use(
        cors({
          credentials: true,
          origin: `${HOST}:3000`,
        })
      );
  
      const apolloServer = new ApolloServer({
        schema: await buildSchema({
          resolvers: [UserResolver],
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
          `Server is running, GraphQL Playground available at ${HOST}:${PORT}/graphql`
        )
      );
    } catch (err) {
      console.error(err);
    }
  }
  
  main();
  
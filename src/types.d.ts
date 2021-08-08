import admin from 'firebase-admin'
import { Response, Request } from 'express';
// import { User } from './entities/user';

export type MyContext = {
  req: Request & { payload: admin.auth.DecodedIdToken };
  res: Response;
};

import { Response, Request } from 'express';
import admin from 'firebase-admin'

export type MyContext = {
  req: Request & { payload: admin.auth.DecodedIdToken };
  res: Response;
};

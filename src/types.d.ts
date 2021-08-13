import { JwtPayload } from 'jsonwebtoken';
import { Response, Request } from 'express';

export interface Payload extends JwtPayload {
  user_id: string;
}

export type MyContext = {
  req: Request & { payload: Payload };
  res: Response;
};

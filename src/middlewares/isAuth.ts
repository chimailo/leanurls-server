import got from 'got';
import jwt from 'jsonwebtoken';
import { AuthenticationError } from 'apollo-server-express';
import { MiddlewareFn } from 'type-graphql';
import { MyContext, Payload } from '../types';

const checkPayload = (payload: Payload) => {
  return (
    payload.aud === 'leanurls' &&
    // payload.auth_time < new Date().getTime() &&
    // payload.exp! > new Date().getTime() &&
    // payload.iat! < new Date().getTime() &&
    payload.iss === 'https://securetoken.google.com/leanurls' &&
    payload.sub !== '' &&
    payload.sub === payload.user_id
  );
};

const verifyIdToken = async (idToken: string) => {
  let payload: Payload;

  try {
    const response = await got(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
    );
    const publicKeys = JSON.parse(response.body);
    const header64 = idToken.split('.')[0];
    const header = JSON.parse(
      Buffer.from(header64, 'base64').toString('ascii')
    );
    payload = jwt.verify(idToken, publicKeys[header.kid], {
      algorithms: ['RS256'],
    }) as Payload;
  } catch (err) {
    console.error(err);
    throw new AuthenticationError('Expired Token');
  }

  if (!checkPayload(payload))
    throw new jwt.TokenExpiredError('Expired Token', new Date(payload.exp!));

  return payload;
};

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const auth_header = context.req.headers.authorization;

  if (!auth_header)
    throw new AuthenticationError('No authorization header in request.');

  const token = auth_header.split(' ')[1];

  if (!token) throw new AuthenticationError('No token in header.');

  let payload;

  try {
    payload = await verifyIdToken(token);
  } catch (error) {
    console.log(error);
    throw new AuthenticationError('Invalid or expired Token');
  }

  context.req.payload = payload;

  return next();
};

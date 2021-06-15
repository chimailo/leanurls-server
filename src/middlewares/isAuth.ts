import path from 'path'
import admin from 'firebase-admin';
import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

const serviceAccount = path.join(__dirname, '../', 'serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const auth_header = context.req.headers.authorization

  if (!auth_header) throw new Error('No authorization header in request.')

  const token = auth_header.split(' ')[1]

  if (!token) throw new Error('No token in header.')
  
  const payload = await admin.auth().verifyIdToken(token)
  context.req.payload = payload
  
  return next();
};

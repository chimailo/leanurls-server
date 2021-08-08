import path from 'path'
import admin from 'firebase-admin';
import { AuthenticationError } from 'apollo-server-express';
import { MiddlewareFn } from 'type-graphql';
import { MyContext } from '../types';

const serviceAccount = path.join(__dirname, '../', 'serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const isAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  const auth_header = context.req.headers.authorization

  if (!auth_header) throw new AuthenticationError('No authorization header in request.')

  const token = auth_header.split(' ')[1]

  if (!token) throw new AuthenticationError('No token in header.')

  let payload

  try {
    payload = await admin.auth().verifyIdToken(token)
  } catch(error) {
    console.log(error)
    throw new AuthenticationError('Invalid or expired Token')
  }
  
  // context.req.user = await User.findOne({ id: payload.uid })
  context.req.payload = payload
  
  return next();
};

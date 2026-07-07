import type { SessionOptions } from 'iron-session';

export interface SessionData {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    cliente_id?: string;
  };
}

export const SESSION_COOKIE = 'agnostic_auth';

const DEV_SECRET = 'dev-only-secret-change-in-production-32ch';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? DEV_SECRET,
  cookieName: SESSION_COOKIE,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  },
};

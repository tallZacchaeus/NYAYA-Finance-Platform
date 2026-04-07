import { cookies } from 'next/headers';
import { getAdminAuth, getAdminDb } from './firebase-admin';

export interface AppSessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role?: string;
}

export interface AppSession {
  user: AppSessionUser;
}

export const SESSION_COOKIE_NAME = 'nyaya_session';
export const SESSION_DURATION_MS = 60 * 60 * 8 * 1000;

const baseSessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export function getSessionCookieOptions(maxAgeSeconds = SESSION_DURATION_MS / 1000) {
  return {
    ...baseSessionCookieOptions,
    maxAge: maxAgeSeconds,
  };
}

export function getClearedSessionCookieOptions() {
  return {
    ...baseSessionCookieOptions,
    maxAge: 0,
  };
}

export async function auth(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const profileDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get();

    if (!profileDoc.exists) {
      return null;
    }

    const profile = profileDoc.data() ?? {};

    return {
      user: {
        id: decodedToken.uid,
        email: (profile.email as string | undefined) ?? decodedToken.email ?? null,
        name: (profile.name as string | undefined) ?? null,
        role: (profile.role as string | undefined) ?? 'requester',
      },
    };
  } catch {
    return null;
  }
}

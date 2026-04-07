import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  getSessionCookieOptions,
} from '@/lib/auth';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { getIp, rateLimit } from '@/lib/rate-limit';

const loginSchema = z.object({
  email: z.string().email(),
  idToken: z.string().min(1),
});

const DEFAULT_POST_LOGIN_REDIRECT = '/dashboard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ message: 'Invalid login payload' }, { status: 400 });
    }

    const { email, idToken } = validated.data;
    const ip = getIp(request);
    const rateLimitKey = `login:${email.toLowerCase()}:${ip}`;

    if (!rateLimit(rateLimitKey, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!decodedToken.email || decodedToken.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ message: 'Unable to verify login.' }, { status: 401 });
    }

    const profileDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get();

    if (!profileDoc.exists) {
      return NextResponse.json({ message: 'User profile not found.' }, { status: 403 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ redirectTo: DEFAULT_POST_LOGIN_REDIRECT });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      sessionCookie,
      getSessionCookieOptions()
    );

    return response;
  } catch (error) {
    console.error('POST /api/session/login error:', error);
    return NextResponse.json({ message: 'Unable to create session.' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  getClearedSessionCookieOptions,
} from '@/lib/auth';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionCookie) {
    try {
      const decodedToken = await getAdminAuth().verifySessionCookie(sessionCookie);
      await getAdminAuth().revokeRefreshTokens(decodedToken.uid);
    } catch {
      // Ignore invalid/expired session cookies and clear them below.
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    '',
    getClearedSessionCookieOptions()
  );

  return response;
}

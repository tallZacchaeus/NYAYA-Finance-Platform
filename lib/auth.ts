/**
 * Server-side auth helper for Next.js App Router.
 *
 * Uses API_URL (private, server-only) for server-to-server calls.
 * Forwards only the session cookies needed for Sanctum — NOT all browser cookies.
 */

import { cookies } from 'next/headers';

// Server-side only — never exposed to the browser
const API_URL  = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export interface AppSessionUser {
  id: number;
  name: string | null;
  email: string | null;
  role: string | null;
  roles: string[];
  is_active: boolean;
  department_id?: number | null;
}

export interface AppSession {
  user: AppSessionUser;
}

export type FrontendRole = 'member' | 'team_lead' | 'finance' | 'admin';

/** Maps a Spatie role name to the frontend role used for routing. */
export function toFrontendRole(role: string | null): FrontendRole {
  if (role === 'super_admin')   return 'admin';
  if (role === 'finance_admin') return 'finance';
  if (role === 'team_lead')     return 'team_lead';
  return 'member';
}

/** Returns only the cookies Sanctum needs. Avoids forwarding analytics / third-party cookies. */
function getSessionCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .filter(c => c.name === 'nyaya-finance-session' || c.name === 'XSRF-TOKEN')
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
}

export async function auth(): Promise<AppSession | null> {
  try {
    const cookieStore   = await cookies();
    const cookieHeader  = getSessionCookieHeader(cookieStore);

    if (!cookieHeader) return null;

    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Accept:              'application/json',
        'X-Requested-With':  'XMLHttpRequest',
        Cookie:              cookieHeader,
        Referer:             `${APP_URL}/`,
        Origin:              APP_URL,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const body = await res.json();
    const u    = body?.data;
    if (!u) return null;

    return {
      user: {
        id:            u.id,
        name:          u.name          ?? null,
        email:         u.email         ?? null,
        role:          u.role          ?? null,
        roles:         u.roles         ?? [],
        is_active:     u.is_active     ?? true,
        department_id: u.department_id ?? null,
      },
    };
  } catch {
    return null;
  }
}

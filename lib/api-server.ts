/**
 * Server-side Laravel API helper for Next.js App Router Server Components.
 *
 * Uses API_URL (private, server-only) for server-to-server calls.
 * Forwards only laravel_session and XSRF-TOKEN — not all browser cookies.
 */

import { cookies } from 'next/headers';

// Server-to-server: always use the direct API URL, never relative paths.
const API_URL = process.env.API_URL ?? 'http://localhost:8001';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

// Session cookie name is derived from APP_NAME in Laravel:
// "NYAYA Finance" → "nyaya-finance-session"
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? 'nyaya-finance-session';

async function getSessionCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .filter(c => c.name === SESSION_COOKIE || c.name === 'XSRF-TOKEN')
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
}

async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const cookieHeader = await getSessionCookieHeader();
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        Accept:             'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie:             cookieHeader,
        Referer:            `${APP_URL}/`,
        Origin:             APP_URL,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

import type {
  FinanceRequest,
  Department,
  ApiEvent,
  Budget,
  PaginatedResponse,
  ApiResponse,
} from './api-client';

export const serverApi = {
  requests: {
    list: (params?: Record<string, string | number>) => {
      const qs = params
        ? '?' + new URLSearchParams(
            Object.entries(params).map(([k, v]) => [k, String(v)])
          ).toString()
        : '';
      return serverFetch<PaginatedResponse<FinanceRequest>>(`/api/finance-requests${qs}`);
    },
    get: (id: number) =>
      serverFetch<ApiResponse<FinanceRequest>>(`/api/finance-requests/${id}`),
    internalList: (params?: Record<string, string | number>) => {
      const qs = params
        ? '?' + new URLSearchParams(
            Object.entries(params).map(([k, v]) => [k, String(v)])
          ).toString()
        : '';
      return serverFetch<PaginatedResponse<FinanceRequest>>(`/api/internal-requests${qs}`);
    },
  },

  departments: {
    list: () => serverFetch<ApiResponse<Department[]>>('/api/departments'),
  },

  events: {
    list: () => serverFetch<ApiResponse<ApiEvent[]>>('/api/events'),
    get:  (id: number) => serverFetch<ApiResponse<ApiEvent>>(`/api/events/${id}`),
  },

  budgets: {
    list: (eventId: number) =>
      serverFetch<ApiResponse<Budget[]>>(`/api/events/${eventId}/budgets`),
  },
};

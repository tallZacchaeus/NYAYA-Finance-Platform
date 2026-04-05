import {
  createServerClient,
  type CookieMethods,
  type CookieOptions,
} from '@supabase/ssr';
import { cookies } from 'next/headers';

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createClient() {
  const cookieStore = await cookies();
  const applyCookie = (name: string, value: string, options: CookieOptions) => {
    const { encode: _encode, ...nextCookieOptions } = options;

    cookieStore.set(name, value, nextCookieOptions);
  };

  const cookieMethods = {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    getAll() {
      return cookieStore.getAll();
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        applyCookie(name, value, options);
      } catch {
        // Server component - cookies can't be set
      }
    },
    setAll(cookiesToSet: CookieToSet[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          applyCookie(name, value, options)
        );
      } catch {
        // Server component - cookies can't be set
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        applyCookie(name, '', { ...options, maxAge: 0 });
      } catch {
        // Server component - cookies can't be set
      }
    },
  } satisfies CookieMethods & {
    getAll(): ReturnType<typeof cookieStore.getAll>;
    setAll(cookiesToSet: CookieToSet[]): void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  );
}

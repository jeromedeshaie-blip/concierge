import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18n = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run i18n middleware (handles locale detection & rewriting)
  const response = handleI18n(request);

  // 2. Create Supabase client using the i18n response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Strip locale prefix to check route
  const pathname = request.nextUrl.pathname;
  const pathnameWithoutLocale =
    pathname.replace(/^\/(en|de)/, "") || "/";

  const publicPaths = ["/login", "/signup", "/auth/callback", "/"];
  const isPublicPath =
    publicPaths.includes(pathnameWithoutLocale) ||
    pathnameWithoutLocale.startsWith("/auth/");

  // 5. Redirect unauthenticated users to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 6. Redirect authenticated users away from login/signup
  if (
    user &&
    (pathnameWithoutLocale === "/login" ||
      pathnameWithoutLocale === "/signup")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

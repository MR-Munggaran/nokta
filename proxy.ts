import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const GUEST_ONLY_ROUTES     = ["/login", "/register"];
const ALWAYS_ALLOWED_ROUTES = ["/login", "/register", "/auth", "/onboarding"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isRoot = pathname === "/";

  if (!user) {
    const isAllowed = ALWAYS_ALLOWED_ROUTES.some((r) => pathname.startsWith(r));
    if (isAllowed || isRoot) return response;
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sudah login → blokir akses ke login/register
  if (GUEST_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
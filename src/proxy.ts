import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProfileComplete, profileFromRow } from "@/lib/profile";
import { safeNextPath } from "@/lib/safe-next";

function isTeacherPage(pathname: string) {
  return pathname === "/teacher" || pathname.startsWith("/teacher/");
}

function isCorePage(pathname: string) {
  return pathname === "/student" || pathname.startsWith("/student/");
}

function isCoreApi(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function carrySession(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = from.headers.get(header);
    if (value) to.headers.set(header, value);
  }
  return to;
}

function loginRedirect(request: NextRequest, session: NextResponse) {
  const url = request.nextUrl.clone();
  const next = safeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  url.pathname = "/login";
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return carrySession(session, NextResponse.redirect(url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isTeacherPage(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/student";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const corePage = isCorePage(pathname);
  const coreApi = isCoreApi(pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    if (corePage) return loginRedirect(request, NextResponse.next());
    if (coreApi) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([header, value]) => {
          response.headers.set(header, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const signedIn = Boolean(claims?.sub) && claims?.is_anonymous !== true;

  if (!signedIn && corePage) return loginRedirect(request, response);
  if (!signedIn && coreApi) {
    return carrySession(response, NextResponse.json({ error: "Sign in first." }, { status: 401 }));
  }

  if (signedIn && corePage && typeof claims?.sub === "string") {
    const { data: row, error } = await supabase
      .from("profiles")
      .select("display_name, username, age, interests")
      .eq("id", claims.sub)
      .maybeSingle();
    if (!error) {
      const complete = isProfileComplete(profileFromRow(row));
      const onboarding = pathname === "/student/onboarding" || pathname.startsWith("/student/onboarding/");
      if (!complete && !onboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/student/onboarding";
        url.search = "";
        return carrySession(response, NextResponse.redirect(url));
      }
      if (complete && onboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/student";
        url.search = "";
        return carrySession(response, NextResponse.redirect(url));
      }
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|design/).*)"],
};

import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/chat", "/setup", "/account"];
const AUTH_ONLY_GUEST = new Set(["/", "/login", "/register"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const access = req.cookies.get("lulla_access")?.value;
  const refresh = req.cookies.get("lulla_refresh")?.value;
  const isAuthed = Boolean(access || refresh);

  // Logged-in users skip the marketing/auth pages and land on the dashboard.
  if (isAuthed && AUTH_ONLY_GUEST.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (!isProtected) {
    return NextResponse.next();
  }
  if (isAuthed) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};

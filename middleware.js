// middleware.js
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const LOGIN_PATH = "/login";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow Next internals, auth endpoints, public assets, and login/register pages
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    pathname === LOGIN_PATH ||
    pathname.startsWith("/register")
  ) {
    return NextResponse.next();
  }

  // Check only requested protected paths matched by config.matcher
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();

  // If no token -> redirect to login (with returnTo)
  if (!token) {
    url.pathname = LOGIN_PATH;
    url.searchParams.set("returnTo", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // token.exp is in seconds (Unix timestamp)
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const tokenExp = token.exp ? Number(token.exp) : null;

  if (tokenExp && tokenExp <= nowInSeconds) {
    // token expired -> redirect with expired flag
    url.pathname = LOGIN_PATH;
    url.searchParams.set("expired", "1");
    url.searchParams.set("returnTo", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // token valid -> allow
  return NextResponse.next();
}

export const config = {
  // matcher: adjust to all protected routes
  matcher: [
    "/notes/:path*",
    "/favorites notes/:path*",
    "/recent notes/:path*",
    "/notes",
    "/favorites notes",
    "/recent notes",
    "/search/:path*",
    "/setting/:path*",
    "/tags/:path*",
    "/topics/:path*",
  ],
};

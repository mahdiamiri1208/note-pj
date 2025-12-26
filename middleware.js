// middleware.js (در ریشه پروژه)
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();

  if (req.nextUrl.pathname.startsWith("/notes")) {
    if (!token) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = { matcher: ["/notes/:path*"] };

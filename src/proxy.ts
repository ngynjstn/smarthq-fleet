// src/middleware.ts
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

// Adapter-FREE instance: safe to run on the edge runtime.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  // 1) Require login on every route this middleware covers.
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/api/auth/signin", nextUrl.origin));
  }

  // 2) The business view AND its API are EXEC-only.
  const isBusiness =
    nextUrl.pathname.startsWith("/business") ||
    nextUrl.pathname.startsWith("/api/business");
  if (isBusiness && role !== "EXEC") {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // Skip Next internals, the auth endpoints, and static files.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

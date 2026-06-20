// src/types/next-auth.d.ts
// Teach Auth.js's types about our custom `role` so it flows
// User (DB) -> JWT token -> session.user.role with no `any` casts.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: { role?: string } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
  }
}

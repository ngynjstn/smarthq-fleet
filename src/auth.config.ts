// src/auth.config.ts
// Edge-safe auth config — providers + callbacks, NO database adapter.
// Shared by the full server config (auth.ts) and the edge middleware.
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  session: { strategy: "jwt" },
  providers: [Google],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role ?? "OPS";
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

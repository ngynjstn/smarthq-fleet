// src/components/AuthButton.tsx
// Server component: reads the session and renders the right control.
import { auth, signIn, signOut } from "@/auth";

export default async function AuthButton() {
  const session = await auth();

  // Logged out -> a button that kicks off the Google OAuth flow.
  if (!session?.user) {
    return (
      <form action={async () => { "use server"; await signIn("google"); }}>
        <button type="submit" className="shq-btn-primary">Sign in with Google</button>
      </form>
    );
  }

  // Logged in -> who you are + role badge, plus a sign-out button.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-2)" }}>
        <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {session.user.email}
        </span>
        <span className="shq-badge" style={{ color: "var(--text-2)", background: "var(--surface-2)" }}>
          {session.user.role}
        </span>
      </span>
      <form action={async () => { "use server"; await signOut(); }}>
        <button type="submit" className="shq-btn-ghost">Sign out</button>
      </form>
    </div>
  );
}

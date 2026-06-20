// src/components/AuthButton.tsx
// Server component: reads the session and renders the right control.
import { auth, signIn, signOut } from "@/auth";

export default async function AuthButton() {
  const session = await auth();

  // Logged out -> a button that kicks off the Google OAuth flow.
  if (!session?.user) {
    return (
      <form action={async () => { "use server"; await signIn("google"); }}>
        <button type="submit" className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700">
          Sign in with Google
        </button>
      </form>
    );
  }

  // Logged in -> show who you are + your role, plus a sign-out button.
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">
        {session.user.email}
        <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {session.user.role}
        </span>
      </span>
      <form action={async () => { "use server"; await signOut(); }}>
        <button type="submit" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Sign out
        </button>
      </form>
    </div>
  );
}

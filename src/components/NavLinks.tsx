"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Header nav with active-route highlighting. Business is EXEC-only,
// gated by the server (layout passes isExec) and also by middleware.
export default function NavLinks({ isExec }: { isExec: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Ops" },
    { href: "/assistant", label: "Assistant" },
    ...(isExec ? [{ href: "/business", label: "Business" }] : []),
  ];

  return (
    <nav className="shq-nav">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          className="shq-navlink"
          data-active={pathname === it.href}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

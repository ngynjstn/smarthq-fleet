"use client";

import { useEffect, useState } from "react";

// Flips data-theme on <html> and persists it. Initial theme is applied
// pre-paint by the inline script in layout.tsx, so there's no flash here.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("shq-theme", next);
    setTheme(next);
  }

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="shq-icon-btn">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

"use client";

import { useSyncExternalStore } from "react";

// The current theme lives on <html data-theme>, applied pre-paint by the
// inline script in layout.tsx. We read it straight from the DOM (no local
// state to drift) and re-render when it changes via a MutationObserver.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("shq-theme", next);
  }

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="shq-icon-btn">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

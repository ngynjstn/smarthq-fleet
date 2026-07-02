import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/AuthButton";
import NavLinks from "@/components/NavLinks";
import ThemeToggle from "@/components/ThemeToggle";
import { auth } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartHQ Fleet",
  description: "Real-time health monitoring for connected GE appliances.",
};

// Apply the saved theme before first paint to avoid a light/dark flash.
const themeInit = `(function(){try{var t=localStorage.getItem('shq-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isExec = session?.user?.role === "EXEC";

  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <header className="shq-header">
          <div className="shq-brand">
            <span className="shq-mark" />
            <div className="shq-wordmark">
              <span style={{ fontWeight: 700, color: "var(--text)" }}>SmartHQ</span>
              <span style={{ fontWeight: 400, color: "var(--text-3)" }}>Fleet</span>
            </div>
          </div>

          <NavLinks isExec={isExec} />

          <div className="shq-header-actions">
            <ThemeToggle />
            <AuthButton />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}

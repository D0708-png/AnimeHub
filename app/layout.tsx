import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "@/styles/globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToastProvider } from "@/components/ToastProvider";
import { SITE_NAME } from "@/lib/constants";

const appSans = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-app-sans",
  display: "swap",
  weight: "100 900"
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s / ${SITE_NAME}`
  },
  description:
    "Discover curated anime collections, continue watching, and explore new episodes with AnimeHub.",
  metadataBase: new URL("https://animehub.example")
};

const themeScript = `
(() => {
  try {
    const stored = window.localStorage.getItem("animehub.theme") || "system";
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const theme = stored === "light" || stored === "dark" ? stored : system;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${appSans.variable} font-sans antialiased`}>
        <SiteHeader />
        <main className="min-h-screen">{children}</main>
        <SiteFooter />
        <ToastProvider />
      </body>
    </html>
  );
}

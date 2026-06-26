import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { AppPrivyProvider } from "@/components/privy-provider";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteFooter } from "@/components/site-footer";
import { HomepageFooterProvider } from "@/components/homepage-footer-context";
import { GlobalSearchProvider } from "@/components/global-search-provider";
import { ThemeProvider } from "@/components/theme-provider";
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SITE_DESCRIPTION,
  SITE_URL,
} from "@/lib/room-og/copy";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Optional: set NEXT_PUBLIC_SITE_URL locally and in production (e.g. https://cope.fun).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "cope.fun",
    template: "%s | Cope",
  },
  description: DEFAULT_SITE_DESCRIPTION,
  openGraph: {
    siteName: "Cope",
    type: "website",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@copefun",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInitScript = `
(() => {
  try {
    const theme = localStorage.getItem("cope-theme") || "dark";
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-app flex-col overflow-x-hidden bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <AppPrivyProvider>
            <GlobalSearchProvider>
              <HomepageFooterProvider>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                <SiteFooter />
                <MobileBottomNav />
              </HomepageFooterProvider>
            </GlobalSearchProvider>
          </AppPrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

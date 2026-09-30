import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoBanner } from "@/components/demo-banner";
import { ADSENSE_CLIENT, APP_NAME, APP_URL, DEMO, LOCAL_DEV } from "@/lib/config";

const description =
  "One free weekly draw. Sponsors and ads fill the pot, one person wins it every Monday, and anyone can verify the draw.";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} · Free weekly draw`, template: `%s · ${APP_NAME}` },
  description,
  metadataBase: new URL(APP_URL),
  openGraph: { title: APP_NAME, description, url: APP_URL, siteName: APP_NAME, type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F4EE" },
    { media: "(prefers-color-scheme: dark)", color: "#11100E" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <SiteHeader />
          {DEMO && <DemoBanner />}
          {LOCAL_DEV && (
            <div className="border-b border-line bg-surface">
              <p className="container py-2.5 text-center text-sm text-muted">
                <span className="font-semibold text-ink">Local mode.</span> Data lives in .local-db/ on this computer.
              </p>
            </div>
          )}
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
        {ADSENSE_CLIENT && (
          <Script
            async
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          />
        )}
      </body>
    </html>
  );
}

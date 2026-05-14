import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReferralCapture } from "@/components/referral-capture";
import { APP_NAME, APP_URL, BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Free prize draws`,
    template: `%s · ${APP_NAME}`,
  },
  description: BRAND.description,
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: APP_NAME,
    description: BRAND.description,
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: BRAND.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("dark", GeistSans.variable, GeistMono.variable)}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <ReferralCapture />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

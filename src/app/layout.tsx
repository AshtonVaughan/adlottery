import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ReferralCapture } from "@/components/referral-capture";
import { APP_NAME, APP_URL, BRAND } from "@/lib/constants";

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
    <html lang="en" className="dark">
      <body className="flex min-h-screen flex-col antialiased">
        <ReferralCapture />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

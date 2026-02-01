import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "@/components/ui";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://drivenex.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DRIVENEX - Compare Leasing, Purchase & Subscriptions",
    template: "%s | DRIVENEX",
  },
  description: "Compare car leasing, purchase, and subscription offers with detailed TCO calculations for Germany. Calculate Kfz-Steuer, insurance, and running costs.",
  keywords: ["car leasing", "car comparison", "TCO calculator", "Germany", "Kfz-Steuer", "auto leasing", "car subscription"],
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: siteUrl,
    siteName: "DRIVENEX",
    title: "DRIVENEX - Compare Leasing, Purchase & Subscriptions",
    description: "Compare car leasing, purchase, and subscription offers with detailed TCO calculations for Germany.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DRIVENEX - Compare Car Offers",
    description: "Compare car offers with detailed TCO calculations for Germany.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

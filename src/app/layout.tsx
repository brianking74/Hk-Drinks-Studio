import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HKDrinks Studio — AI Social Media Poster",
  description:
    "Upload a drink photo, let AI write the caption, and publish or schedule to your Facebook & Instagram — built for the HKDrinks community.",
  keywords: [
    "HKDrinks",
    "Hong Kong",
    "Facebook",
    "Instagram",
    "AI caption",
    "social media automation",
  ],
  authors: [{ name: "HKDrinks" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "HKDrinks Studio",
    description: "AI-powered posting for Facebook & Instagram",
    siteName: "HKDrinks",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HKDrinks Studio",
    description: "AI-powered posting for Facebook & Instagram",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

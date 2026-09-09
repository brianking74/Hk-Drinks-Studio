import type { Metadata } from "next";
import { Cormorant_Garamond, Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HKDrinks Studio — Premium Spirits Social Poster",
  description:
    "Upload a bottle or serve photo and let HKDrinks' AI draft an on-brand caption for Facebook & Instagram. Built for Hong Kong's home of premium spirits.",
  keywords: [
    "HKDrinks",
    "Hong Kong",
    "premium spirits",
    "tequila",
    "mezcal",
    "whisky",
    "cognac",
    "Facebook",
    "Instagram",
    "AI caption",
    "social media automation",
  ],
  authors: [{ name: "HK Drinks" }],
  icons: {
    icon: "/hkdrinks-logo.png",
  },
  openGraph: {
    title: "HKDrinks Studio",
    description: "AI-powered posting for Facebook & Instagram — Hong Kong's home of premium spirits.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${cormorant.variable} ${montserrat.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: 'var(--font-montserrat), system-ui, sans-serif' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

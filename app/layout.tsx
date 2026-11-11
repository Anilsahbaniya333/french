import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mappell.com";

/** Social share preview (WhatsApp, Facebook, LinkedIn, X…) — the Mappell Academy logo. */
const OG_IMAGE = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  alt: "Mappell Academy — French · Future · Freedom",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mappell French | Online French Classes & TCF / TEF Canada Preparation",
  description:
    "Learn French from zero to B2 online with live classes, recordings, weekly mini exams, personalized feedback, and TCF / TEF Canada preparation.",
  openGraph: {
    type: "website",
    siteName: "Mappell Academy",
    url: "/",
    title: "Mappell French — Online French Classes & TCF / TEF Canada Preparation",
    description: "Start French from zero. Live classes, recordings, weekly mini exams and personalized feedback.",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mappell French — Online French Classes & TCF / TEF Canada Preparation",
    description: "Start French from zero. Live classes, recordings, weekly mini exams and personalized feedback.",
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}

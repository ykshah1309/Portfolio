import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yash Shah — Founder & CEO, Avarieux Inc.",
  description:
    "Yash Kamlesh Shah is the Founder and CEO of Avarieux Inc., a multi-source AI research platform for self-directed investors and registered investment advisors. Building citation infrastructure for AI in financial research.",
  keywords: [
    "Yash Shah",
    "Avarieux",
    "AI research platform",
    "Model Context Protocol",
    "MCP server",
    "fintech founder",
    "financial AI",
    "Papex",
  ],
  authors: [{ name: "Yash Kamlesh Shah", url: "https://avarieux.com" }],
  creator: "Yash Kamlesh Shah",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yashshah.dev",
    siteName: "Yash Shah",
    title: "Yash Shah — Founder & CEO, Avarieux Inc.",
    description:
      "Building citation infrastructure for AI in financial research. Founder of Avarieux — a multi-source AI research platform where every claim is source-audited and every analysis is a permanent, citable URL.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Yash Shah — Founder & CEO, Avarieux Inc.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yash Shah — Founder & CEO, Avarieux Inc.",
    description:
      "Building citation infrastructure for AI in financial research. Founder of Avarieux.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

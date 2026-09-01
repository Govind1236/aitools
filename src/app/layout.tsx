import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ParticlesInit } from "@/components/ui/particles-provider";
import { ThemeProvider } from "@/components/ui/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AI Tools Directory — Discover the Best AI Tools",
    template: "%s — AI Tools Directory",
  },
  description:
    "Discover the best AI tools for writing, image generation, video creation, coding, and more. Curated, reviewed, and organized for professionals.",
  keywords: [
    "AI tools",
    "artificial intelligence",
    "AI directory",
    "machine learning",
    "AI writing",
    "AI image",
    "AI video",
    "AI coding",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "AI Tools Directory",
    title: "AI Tools Directory — Discover the Best AI Tools",
    description:
      "Discover the best AI tools for work, business, creativity and productivity.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tools Directory — Discover the Best AI Tools",
    description:
      "Discover the best AI tools for work, business, creativity and productivity.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground transition-colors duration-300 overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ParticlesInit>
            <ScrollProgress />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ParticlesInit>
        </ThemeProvider>
      </body>
    </html>
  );
}

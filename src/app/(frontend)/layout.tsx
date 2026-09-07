import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HeaderWithCategories } from "@/components/ui/header-wrapper";
import { Footer } from "@/components/ui/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { ParticlesInit } from "@/components/ui/particles-provider";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Script from "next/script";

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
        <Script src="https://pl31235423.profitableratecpmnetwork.com/32/dd/ef/32ddef192bae99af6eb61e2b05122239.js" strategy="afterInteractive" />
        <Script src="https://pl31235424.profitableratecpmnetwork.com/56/88/13/568813c96f21434b16044db28bc8c3f3.js" strategy="afterInteractive" />
        <Script src="https://www.profitableratecpmnetwork.com/kazfes7zpb?key=0f05a4c36561425ba797b657c6bc5888" strategy="afterInteractive" />
        <Script async data-cfasync="false" src="https://pl31235632.profitableratecpmnetwork.com/f4de227ed69e92e032daffc3a4b4d2f4/invoke.js" strategy="afterInteractive" />
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-background text-foreground transition-colors duration-300 overflow-x-hidden" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ParticlesInit>
            <ScrollProgress />
            <HeaderWithCategories />
            <main className="flex-1">{children}</main>
            <div id="container-f4de227ed69e92e032daffc3a4b4d2f4"></div>
            <Footer />
          </ParticlesInit>
        </ThemeProvider>
      </body>
    </html>
  );
}

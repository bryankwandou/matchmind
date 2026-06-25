import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "MatchMind — Live World Cup Analysis",
  description:
    "Every goal, every odds shift, every red card — explained in plain language as it happens. Powered by TxLINE live data and Groq AI.",
  keywords: ["World Cup 2026", "football", "live odds", "AI analysis", "TxLINE"],
  openGraph: {
    title: "MatchMind — Live World Cup Analysis",
    description: "Real-time AI commentary for every World Cup match.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`} style={{ background: "var(--bg)", color: "var(--text)" }}>
        {children}
      </body>
    </html>
  );
}

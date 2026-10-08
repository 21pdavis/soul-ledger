import type { Metadata, Viewport } from "next";
import { Limelight, Space_Grotesk } from "next/font/google";
import "./tokens.css";
import "./globals.css";

const display = Limelight({ weight: "400", subsets: ["latin"], variable: "--font-limelight" });
const body = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata: Metadata = {
  title: "Soul Ledger",
  description: "Your Deadlock year, wrapped.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

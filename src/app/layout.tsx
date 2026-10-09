import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VIVA-X | AI Viva Examiner",
  description: "Prepare for your viva with your AI-powered examiner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
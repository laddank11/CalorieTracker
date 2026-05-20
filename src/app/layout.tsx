import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriTrack",
  description: "Track your daily calories and macros — no account needed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

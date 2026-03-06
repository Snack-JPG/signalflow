import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalFlow | Unified Trading Command Center",
  description: "Real-time crypto intelligence combining order flow and narrative analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
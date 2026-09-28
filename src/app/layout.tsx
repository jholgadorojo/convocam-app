import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: "Convoca'm",
  description: "Tu portal personal de convocatorias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={instrumentSans.className}>
        {children}
      </body>
    </html>
  );
}
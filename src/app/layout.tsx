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
  title: "BarbaInegol Law Firm PLLC - Legal Services Management",
  description: "Manage immigration cases and client contracts efficiently",
  icons: {
    icon: [
      { url: '/logob.jpeg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/logob.jpeg', sizes: '16x16', type: 'image/jpeg' },
    ],
    shortcut: '/logob.jpeg',
    apple: '/logob.jpeg',
    other: {
      rel: 'icon',
      url: '/logob.jpeg',
    },
  },
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

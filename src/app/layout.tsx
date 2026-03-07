import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "李伟个人博客",
  description: "Next.js app with Better Auth",
  icons: {
    icon: [
      {
        url: "/assets/Gemini_Generated_Image_gfqficgfqficgfqf.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/assets/Gemini_Generated_Image_gfqficgfqficgfqf.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    shortcut: "/assets/Gemini_Generated_Image_gfqficgfqficgfqf.png",
    apple: "/assets/Gemini_Generated_Image_gfqficgfqficgfqf.png",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

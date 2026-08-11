import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liwei.coilleaf.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "李伟 | 全栈开发者个人博客",
    template: "%s | 李伟博客",
  },
  description:
    "李伟，全栈开发者，精通 Next.js / React / Node.js / TypeScript。展示项目作品、技术博客、求职简历与联系方式。",
  keywords: [
    "李伟",
    "全栈开发",
    "Next.js",
    "React",
    "TypeScript",
    "前端开发",
    "Node.js",
    "个人博客",
    "求职",
    "程序员",
  ],
  authors: [{ name: "李伟" }],
  creator: "李伟",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "李伟个人博客",
    title: "李伟 | 全栈开发者个人博客",
    description:
      "全栈开发者李伟的个人博客，展示项目作品、技术文章与求职简历。",
    images: [
      {
        url: "/assets/Gemini_Generated_Image_gfqficgfqficgfqf.png",
        width: 1200,
        height: 630,
        alt: "李伟个人博客",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "李伟 | 全栈开发者个人博客",
    description:
      "全栈开发者李伟的个人博客，展示项目作品、技术文章与求职简历。",
    images: ["/assets/Gemini_Generated_Image_gfqficgfqficgfqf.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
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
        <Analytics />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import { loveStory } from "@/config/story";
import "./globals.css";
import "./experience.css";
import "./entry.css";
const serif = localFont({
  src: [
    {
      path: "../../public/fonts/serif-2.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/serif-0.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
});
const sans = localFont({
  src: "../../public/fonts/sans-0.woff2",
  variable: "--font-sans",
  display: "swap",
});
const hand = localFont({
  src: "../../public/fonts/hand-0.woff2",
  variable: "--font-hand",
  display: "swap",
  preload: false,
});
export const metadata: Metadata = {
  title: `${loveStory.siteTitle} | Tulips, thodi masti & tum`,
  description:
    `${loveStory.girlfriendName} ke liye tulips, kuch messages aur ek chhota sa surprise. Aaram se dekho.`,
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${serif.variable} ${sans.variable} ${hand.variable}`}>
        {children}
      </body>
    </html>
  );
}

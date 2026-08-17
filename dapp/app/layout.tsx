import "./globals.css";
import { Inter } from "next/font/google";
import {Metadata} from "next";
import {MainProvider} from "@/components/MainProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Alien Harvesters',
  description: 'Begin your cosmic journey and mint unique Aptos Aliens',
  robots: 'follow, index',
  icons: {
    icon: [
      {rel: "icon", type: "image/png", sizes: "32x32", url: '/favicon-32x32.png'},
      {rel: "icon", type: "image/png", sizes: "16x16", url: '/favicon-16x16.png'},
      {rel: "icon", url: '/favicon.ico'},
    ],
    apple: [
      {rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png"},
    ],
  },
  manifest: '/site.webmanifest'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <MainProvider>
          {children}
        </MainProvider>
      </body>
    </html>
  );
}

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
  title: "Image Editor | OpenCV.js - Edit Images Online",
  description: "Free online image editor with OpenCV.js. Adjust the brightness, contrast, and saturation of your images easily without additional software.",
  generator: "Next.js",
  applicationName: "Image Editor",
  referrer: "origin-when-cross-origin",
  keywords: ["image editor", "photo edit", "opencv", "brightness", "contrast", "saturation", "image processing", "web app", "free"],
  authors: [{ name: "Baharihari", url: "https://baharihari.com" }],
  creator: "Baharihari",
  publisher: "Baharihari",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://image-editor.baharihari.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Image Editor | Edit Images Online with OpenCV.js",
    description: "Free online image editor. Adjust brightness, contrast, and saturation easily without additional software.",
    url: "https://image-editor.baharihari.com",
    siteName: "Image Editor",
    images: [
      {
        url: "https://image-editor.baharihari.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Image Editor Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Editor | Edit Images Online with OpenCV.js",
    description: "Free online image editor. Adjust brightness, contrast, and saturation easily.",
    images: ["https://image-editor.baharihari.com/twitter-image.jpg"],
    creator: "@baharihari",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "https://res.cloudinary.com/du0tz73ma/image/upload/v1741796607/image-editor-logo-simple_hlyev0.svg" },
      { url: "https://res.cloudinary.com/du0tz73ma/image/upload/v1741796607/image-editor-logo-simple_hlyev0.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "https://res.cloudinary.com/du0tz73ma/image/upload/v1741796607/image-editor-logo-simple_hlyev0.svg", type: "image/svg+xml" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "https://res.cloudinary.com/du0tz73ma/image/upload/v1741796607/image-editor-logo-simple_hlyev0.svg",
      },
    ],
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "google-site-verification-code", // Replace with your Google verification code
    yandex: "yandex-verification-code", // Replace with your Yandex verification code if available
  },
  category: "technology",
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
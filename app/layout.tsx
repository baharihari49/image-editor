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
  title: "Image Editor | OpenCV.js - Edit Gambar Online",
  description: "Editor gambar online gratis dengan OpenCV.js. Atur brightness, contrast, dan saturation gambar Anda dengan mudah tanpa perlu software tambahan.",
  generator: "Next.js",
  applicationName: "Image Editor",
  referrer: "origin-when-cross-origin",
  keywords: ["editor gambar", "edit foto", "opencv", "brightness", "contrast", "saturation", "image processing", "web app", "gratis"],
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
    title: "Image Editor | Edit Gambar Online dengan OpenCV.js",
    description: "Editor gambar online gratis. Sesuaikan brightness, contrast, dan saturation dengan mudah tanpa software tambahan.",
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
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Editor | Edit Gambar Online dengan OpenCV.js",
    description: "Editor gambar online gratis. Atur brightness, contrast, dan saturation dengan mudah.",
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
    google: "google-site-verification-code", // Ganti dengan kode verifikasi Google Anda
    yandex: "yandex-verification-code", // Ganti dengan kode verifikasi Yandex Anda jika ada
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Jika Anda menggunakan OpenCV.js dari CDN dan mengalami masalah CORS
  // Anda bisa mengaktifkan konfigurasi security headers berikut
  /*
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  */
  // Konfigurasi tambahan di sini
};

export default nextConfig;

'use client'

import React from 'react';
import dynamic from 'next/dynamic';

// Loading component
const LoadingPlaceholder = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
    <div className="text-center">
      <div className="h-12 w-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-300 border-l-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
        Memuat Editor Gambar...
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2">
        Mohon tunggu sementara kami menyiapkan alat pengeditan
      </p>
    </div>
  </div>
);

// Dynamically import the ImageEditor component with no SSR
const ImageEditor = dynamic(
  () => import('@/components/ImageEditor'),
  { 
    ssr: false,
    loading: () => <LoadingPlaceholder />
  }
);

export default function ImageEditorPage() {
  return <ImageEditor />;
}
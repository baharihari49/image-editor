'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Download, ImageIcon, RotateCcw } from 'lucide-react';

// Komponen image editor yang lebih sederhana tanpa OpenCV
// untuk memastikan fungsionalitas dasar berjalan dengan baik
const SimpleImageEditor: React.FC = () => {
  // State
  const [image, setImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  
  // Fungsi untuk menangani upload gambar
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setLoading(true);
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        // Set image URL state
        setImage(event.target.result);
        
        // Inisialisasi gambar untuk digunakan dalam canvas
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          applyEffects();
          setLoading(false);
        };
        img.src = event.target.result;
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      setLoading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Fungsi untuk menerapkan efek ke gambar
  const applyEffects = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Reset canvas
    const img = imageRef.current;
    
    // Set canvas dimensions
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 800;
    
    let width = img.width;
    let height = img.height;
    
    // Scale image if too large
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      if (width > height) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      } else {
        width = Math.round(width * (MAX_HEIGHT / height));
        height = MAX_HEIGHT;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Dapatkan data piksel
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply brightness, contrast, saturation
    const brightnessValue = (brightness - 100) * 2.55; // Scale to -255 to 255
    const contrastFactor = (contrast / 100) ** 2; // Square for better control
    
    for (let i = 0; i < data.length; i += 4) {
      // Brightness (tambah/kurang nilai)
      data[i] = Math.max(0, Math.min(255, data[i] + brightnessValue));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightnessValue));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightnessValue));
      
      // Contrast (faktor pengali)
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Adjust contrast (relative to 128 gray)
      data[i] = Math.max(0, Math.min(255, 128 + (r - 128) * contrastFactor));
      data[i + 1] = Math.max(0, Math.min(255, 128 + (g - 128) * contrastFactor));
      data[i + 2] = Math.max(0, Math.min(255, 128 + (b - 128) * contrastFactor));
      
      // Saturation (berdasarkan luma)
      if (saturation !== 100) {
        const satFactor = saturation / 100;
        const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
        data[i] = Math.max(0, Math.min(255, gray + (data[i] - gray) * satFactor));
        data[i + 1] = Math.max(0, Math.min(255, gray + (data[i + 1] - gray) * satFactor));
        data[i + 2] = Math.max(0, Math.min(255, gray + (data[i + 2] - gray) * satFactor));
      }
    }
    
    // Terapkan data piksel yang telah dimodifikasi kembali ke canvas
    ctx.putImageData(imageData, 0, 0);
  };
  
  // Aplikasikan efek ketika slider berubah
  useEffect(() => {
    if (image) {
      applyEffects();
    }
  }, [brightness, contrast, saturation, image]);
  
  // Reset semua pengaturan
  const handleReset = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };
  
  // Download gambar hasil
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    try {
      const dataURL = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'edited-image.png';
      link.href = dataURL;
      link.click();
    } catch (e) {
      console.error('Error downloading image', e);
      
      // Fallback ke gambar asli jika ada
      if (image) {
        const link = document.createElement('a');
        link.download = 'original-image.png';
        link.href = image;
        link.click();
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            Simple Editor Gambar
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Unggah gambar dan sesuaikan brightness, contrast, dan saturation dengan mudah
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Upload and Preview */}
          <div className="lg:col-span-7 space-y-6">
            {/* Upload Card */}
            <Card className="shadow-md overflow-hidden p-0">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-5 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Upload Gambar</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Format yang didukung: JPG, PNG, WebP</p>
              </div>
              
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div 
                    className="w-full h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-500 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <ImageIcon className="h-8 w-8 text-blue-400 dark:text-blue-300 mb-2" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Klik untuk memilih gambar
                    </span>
                  </div>
                  <input 
                    id="file-input" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                  
                  <div className="flex justify-between gap-4">
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Preview Card */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle>Preview Hasil</CardTitle>
                <CardDescription>
                  {image ? 'Lihat hasil penyesuaian secara langsung' : 'Unggah gambar untuk mulai mengedit'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                  {!image ? (
                    <div className="text-center p-6">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Belum ada gambar yang diunggah
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-[400px] object-contain border border-gray-200 dark:border-gray-700"
                      />
                      
                      {loading && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="h-8 w-8 border-4 border-t-blue-500 border-r-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Download Button */}
                {image && (
                  <div className="mt-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white" 
                      onClick={handleDownload}
                      disabled={loading}
                    >
                      <Download className="h-4 w-4 mr-2" /> Unduh Hasil
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right panel - Adjustments */}
          <div className="lg:col-span-5">
            <Card className="shadow-md h-fit">
              <CardHeader>
                <CardTitle>Pengaturan Gambar</CardTitle>
                <CardDescription>
                  Sesuaikan parameter untuk mengubah gambar Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Brightness Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="brightness" className="text-base">Brightness</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{brightness}</span>
                  </div>
                  <Slider
                    id="brightness"
                    min={0}
                    max={200}
                    step={1}
                    value={[brightness]}
                    onValueChange={(values) => setBrightness(values[0])}
                    disabled={!image}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Gelap</span>
                    <span>Normal</span>
                    <span>Terang</span>
                  </div>
                </div>
                
                {/* Contrast Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="contrast" className="text-base">Contrast</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{contrast}</span>
                  </div>
                  <Slider
                    id="contrast"
                    min={0}
                    max={200}
                    step={1}
                    value={[contrast]}
                    onValueChange={(values) => setContrast(values[0])}
                    disabled={!image}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Rendah</span>
                    <span>Normal</span>
                    <span>Tinggi</span>
                  </div>
                </div>
                
                {/* Saturation Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="saturation" className="text-base">Saturation</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{saturation}</span>
                  </div>
                  <Slider
                    id="saturation"
                    min={0}
                    max={200}
                    step={1}
                    value={[saturation]}
                    onValueChange={(values) => setSaturation(values[0])}
                    disabled={!image}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Abu-abu</span>
                    <span>Normal</span>
                    <span>Vivid</span>
                  </div>
                </div>
                
                {/* Reset Button */}
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleReset}
                    disabled={!image}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Semua Pengaturan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>
            Dikembangkan dengan Next.js, TailwindCSS, dan shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleImageEditor;
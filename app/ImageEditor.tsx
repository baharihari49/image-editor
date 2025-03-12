'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, Download, ImageIcon, RotateCcw } from 'lucide-react';

// TypeScript interfaces
interface AdjustmentParams {
  brightness: number;
  contrast: number;
  saturation: number;
}

const ImageEditor: React.FC = () => {
  // State for image and canvas
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  
  // Adjustment parameters
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  
  // Reference to track adjustment history
  const lastAdjustmentRef = useRef<AdjustmentParams>({
    brightness: 0,
    contrast: 0,
    saturation: 0
  });
  
  // Canvas refs
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // OpenCV loaded flag
  const [cvLoaded, setCvLoaded] = useState<boolean>(false);
  
  // Load OpenCV.js script
  useEffect(() => {
    // Check if OpenCV is already loaded
    if (window.cv) {
      console.log('OpenCV already available in window');
      setCvLoaded(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
    script.async = true;
    
    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/opencv.js/3.4.0/opencv.js';
      fallbackScript.async = true;
      
      fallbackScript.onload = () => {
        console.log('OpenCV.js loaded from fallback source');
        setCvLoaded(true);
      };
      
      fallbackScript.onerror = () => {
        console.error('Failed to load OpenCV.js from fallback source');
      };
      
      document.body.appendChild(fallbackScript);
    };
    
    script.onload = () => {
      console.log('OpenCV.js loaded successfully');
      setCvLoaded(true);
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  // Process image with OpenCV
  const processImage = useCallback(() => {
    console.log('Process image starting...');
    
    // Update the last adjustment reference
    lastAdjustmentRef.current = {
      brightness,
      contrast,
      saturation
    };
    
    if (!imageLoaded || !window.cv) {
      console.log('Cannot process: OpenCV or image not ready', {
        imageLoaded,
        cvLoaded: Boolean(window.cv)
      });
      return;
    }
    
    // Check if canvas refs exist
    if (!inputCanvasRef.current) {
      console.error('Input canvas ref is null');
      return;
    }
    
    if (!outputCanvasRef.current) {
      console.error('Output canvas ref is null');
      return;
    }
    
    // Additional checks for canvas contexts
    try {
      const inputContext = inputCanvasRef.current.getContext('2d');
      const outputContext = outputCanvasRef.current.getContext('2d');
      
      if (!inputContext || !outputContext) {
        console.error('Cannot get canvas contexts');
        return;
      }
    } catch (err) {
      console.error('Error accessing canvas contexts:', err);
      return;
    }
    
    setProcessing(true);
    
    try {
      console.log('Starting image processing');
      
      // Ensure input canvas has content by redrawing the image
      if (originalImage) {
        const inputCtx = inputCanvasRef.current.getContext('2d');
        if (inputCtx) {
          inputCtx.clearRect(0, 0, inputCanvasRef.current.width, inputCanvasRef.current.height);
          inputCtx.drawImage(originalImage, 0, 0, inputCanvasRef.current.width, inputCanvasRef.current.height);
        } else {
          throw new Error('Could not get input canvas context');
        }
      } else {
        throw new Error('No original image available');
      }
      
      // Prepare output canvas
      const outputCtx = outputCanvasRef.current.getContext('2d');
      if (outputCtx) {
        outputCtx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
      } else {
        throw new Error('Could not get output canvas context');
      }
      
      // Read input image from canvas
      let src = window.cv.imread(inputCanvasRef.current);
      let dst = new window.cv.Mat();
      
      console.log('Image read from canvas:', {
        width: src.cols,
        height: src.rows,
        channels: src.channels()
      });
      
      // Apply brightness and contrast adjustments
      // alpha controls contrast, beta controls brightness
      const alpha = (contrast / 100) + 1; // Range: 0.0 to 2.0
      const beta = brightness; // Range: -100 to 100
      
      window.cv.convertScaleAbs(src, dst, alpha, beta);
      
      // Apply saturation adjustment (if not zero)
      if (saturation !== 0) {
        // Convert to HSV for saturation adjustment
        let hsv = new window.cv.Mat();
        window.cv.cvtColor(dst, hsv, window.cv.COLOR_RGB2HSV);
        
        // Split the HSV channels
        let channels = new window.cv.MatVector();
        window.cv.split(hsv, channels);
        
        // Adjust saturation channel
        const saturationScale = (saturation / 100) + 1; // Range: 0.0 to 2.0
        channels.get(1).convertTo(channels.get(1), -1, saturationScale, 0);
        
        // Merge the channels back
        window.cv.merge(channels, hsv);
        
        // Convert back to RGB
        window.cv.cvtColor(hsv, dst, window.cv.COLOR_HSV2RGB);
        
        // Free memory
        hsv.delete();
        channels.delete();
      }
      
      console.log('Before imshow, checking output canvas:', {
        width: outputCanvasRef.current.width,
        height: outputCanvasRef.current.height
      });
      
      // Display result on output canvas
      window.cv.imshow(outputCanvasRef.current, dst);
      
      console.log('Image processing complete');
      
      // Clean up
      src.delete();
      dst.delete();
    } catch (err) {
      console.error('Error processing image:', err);
      
      // Fallback - Direct draw to output canvas if OpenCV fails
      if (originalImage && outputCanvasRef.current) {
        try {
          const ctx = outputCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
            ctx.drawImage(originalImage, 0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
            console.log('Used fallback direct drawing to output canvas');
          }
        } catch (fallbackErr) {
          console.error('Even fallback drawing failed:', fallbackErr);
        }
      }
    } finally {
      setProcessing(false);
    }
  }, [brightness, contrast, saturation, imageLoaded, originalImage]);
  
  // Handle file upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    console.log('File selected:', file.name, file.type, file.size);
    
    // Set temporary loading state
    setProcessing(true);
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target || typeof event.target.result !== 'string') {
        console.error('FileReader result is not a string');
        setProcessing(false);
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        console.log('Image loaded successfully:', {
          width: img.width,
          height: img.height
        });
        
        // Maximum dimensions for better performance
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
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
        
        // Save original image and update state
        setOriginalImage(img);
        setImageLoaded(true);
        
        // Make sure canvas refs exist before setting their properties
        setTimeout(() => {
          if (inputCanvasRef.current) {
            inputCanvasRef.current.width = width;
            inputCanvasRef.current.height = height;
            const inputCtx = inputCanvasRef.current.getContext('2d');
            
            if (inputCtx) {
              // Clear canvas first
              inputCtx.clearRect(0, 0, width, height);
              inputCtx.drawImage(img, 0, 0, width, height);
              console.log('Drew image to input canvas');
            } else {
              console.error('Could not get 2D context from input canvas');
            }
          } else {
            console.error('Input canvas ref is null');
          }
          
          if (outputCanvasRef.current) {
            outputCanvasRef.current.width = width;
            outputCanvasRef.current.height = height;
            console.log('Set output canvas dimensions');
            
            // Draw initial image directly on output canvas as a fallback
            const outputCtx = outputCanvasRef.current.getContext('2d');
            if (outputCtx) {
              outputCtx.clearRect(0, 0, width, height);
              outputCtx.drawImage(img, 0, 0, width, height);
              console.log('Drew initial image to output canvas as fallback');
            }
          } else {
            console.error('Output canvas ref is null');
          }
          
          // Reset adjustments
          setBrightness(0);
          setContrast(0);
          setSaturation(0);
          
          // Update reference values
          lastAdjustmentRef.current = {
            brightness: 0,
            contrast: 0,
            saturation: 0
          };
          
          // Process with default values only if OpenCV is loaded
          if (window.cv) {
            console.log('OpenCV is available, processing image');
            processImage();
          } else {
            console.warn('OpenCV not loaded yet, using direct canvas copy');
            setProcessing(false);
          }
        }, 100);
      };
      
      img.onerror = (err) => {
        console.error('Error loading image:', err);
        setProcessing(false);
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = (err) => {
      console.error('Error reading file:', err);
      setProcessing(false);
    };
    
    reader.readAsDataURL(file);
  }, [processImage]);
  
  // Apply adjustments when parameters change
  useEffect(() => {
    if (!imageLoaded) return;
    
    console.log('Parameters changed, processing image with:', {
      brightness, 
      contrast, 
      saturation
    });
    
    const timer = setTimeout(() => {
      // Check if canvas refs are valid before processing
      if (inputCanvasRef.current && outputCanvasRef.current && window.cv) {
        processImage();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [brightness, contrast, saturation, imageLoaded, processImage]);
  
  // Re-process when OpenCV loads after image is already loaded
  useEffect(() => {
    if (cvLoaded && imageLoaded && window.cv) {
      console.log('OpenCV loaded after image, now processing');
      
      const timer = setTimeout(() => {
        if (inputCanvasRef.current && outputCanvasRef.current) {
          processImage();
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [cvLoaded, imageLoaded, processImage]);
  
  // Download the processed image
  const handleDownload = () => {
    if (!imageLoaded || !outputCanvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = outputCanvasRef.current.toDataURL('image/png');
    link.click();
  };
  
  // Reset all adjustments
  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            Editor Gambar dengan OpenCV
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Unggah gambar dan sesuaikan brightness, contrast, dan saturation dengan mudah
          </p>
        </div>
        
        {/* New layout - No tabs, everything in one view */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Upload and Preview - Takes 7/12 columns on large screens */}
          <div className="lg:col-span-7 space-y-6">
            {/* Upload Button Card - Redesigned */}
            <Card className="shadow-md overflow-hidden">
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
                      variant="outline" 
                      className="flex-1"
                      onClick={handleReset}
                      disabled={!imageLoaded}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" /> Reset
                    </Button>
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={handleDownload}
                      disabled={!imageLoaded}
                    >
                      <Download className="h-4 w-4 mr-2" /> Unduh
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
                  {imageLoaded ? 'Lihat hasil penyesuaian secara langsung' : 'Unggah gambar untuk mulai mengedit'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                  {!imageLoaded ? (
                    <div className="text-center p-6">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Belum ada gambar yang diunggah
                      </p>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <canvas 
                        ref={outputCanvasRef} 
                        className="max-w-full max-h-[400px] object-contain border border-gray-200 dark:border-gray-700" 
                        style={{display: 'block'}}
                      />
                      {processing && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="h-8 w-8 border-4 border-t-blue-500 border-r-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right panel - Adjustments - Takes 5/12 columns on large screens */}
          <div className="lg:col-span-5">
            <Card className="shadow-md h-full">
              <CardHeader>
                <CardTitle>Pengaturan Gambar</CardTitle>
                <CardDescription>
                  Sesuaikan parameter untuk mengubah gambar Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="brightness" className="text-base">Brightness</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{brightness}</span>
                  </div>
                  <Slider
                    id="brightness"
                    min={-100}
                    max={100}
                    step={1}
                    value={[brightness]}
                    onValueChange={(values) => setBrightness(values[0])}
                    disabled={!imageLoaded}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Gelap</span>
                    <span>Normal</span>
                    <span>Terang</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="contrast" className="text-base">Contrast</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{contrast}</span>
                  </div>
                  <Slider
                    id="contrast"
                    min={-100}
                    max={100}
                    step={1}
                    value={[contrast]}
                    onValueChange={(values) => setContrast(values[0])}
                    disabled={!imageLoaded}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Rendah</span>
                    <span>Normal</span>
                    <span>Tinggi</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="saturation" className="text-base">Saturation</Label>
                    <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{saturation}</span>
                  </div>
                  <Slider
                    id="saturation"
                    min={-100}
                    max={100}
                    step={1}
                    value={[saturation]}
                    onValueChange={(values) => setSaturation(values[0])}
                    disabled={!imageLoaded}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Abu-abu</span>
                    <span>Normal</span>
                    <span>Vivid</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleReset}
                    disabled={!imageLoaded}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Reset Semua Pengaturan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Input canvas - always rendered but hidden */}
        <div style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}>
          <canvas ref={inputCanvasRef} />
        </div>
        
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>
            Dikembangkan dengan OpenCV.js, Next.js, TailwindCSS, dan shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
};

// Add OpenCV type definitions for TypeScript
declare global {
  interface Window {
    cv: {
      imread: (canvas: HTMLCanvasElement) => any;
      imshow: (canvas: HTMLCanvasElement, mat: any) => void;
      Mat: any;
      MatVector: any;
      cvtColor: (src: any, dst: any, code: number) => void;
      convertScaleAbs: (src: any, dst: any, alpha: number, beta: number) => void;
      split: (src: any, channels: any) => void;
      merge: (channels: any, dst: any) => void;
      COLOR_RGB2HSV: number;
      COLOR_HSV2RGB: number;
    };
  }
}

export default ImageEditor;
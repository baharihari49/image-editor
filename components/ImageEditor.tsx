'use client'

/* eslint-disable */
import React, { useState, useEffect, useRef } from 'react';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import ImageAdjustments from './ImageAdjustments';
import { AdjustmentParams } from '../types';

const ImageEditor: React.FC = () => {
  // State for image and canvas
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  
  // Debug information
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Adjustment parameters
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [invert, setInvert] = useState<boolean>(false);
  const [sepia, setSepia] = useState<number>(0);
  const [hueRotate, setHueRotate] = useState<number>(0);
  
  // Canvas ref
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Timer ref for debounce
  const timerRef = useRef<any>(null);
  
  // Detect iOS on component mount
  useEffect(() => {
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    const isIOSDevice = detectIOS();
    setIsIOS(isIOSDevice);
    setDebugInfo(`Device: ${isIOSDevice ? 'iOS' : 'Other'}`);
  }, []);
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    setUploading(true);
    setDebugInfo('Reading file...');
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target || typeof event.target.result !== 'string') {
        setUploading(false);
        setDebugInfo('Error: Failed to read file');
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Set maximum dimensions (smaller for iOS)
        const MAX_DIMENSION = isIOS ? 500 : 1200;
        
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        
        // Determine dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            width = MAX_DIMENSION;
            height = Math.round(width / aspectRatio);
          } else {
            height = MAX_DIMENSION;
            width = Math.round(height * aspectRatio);
          }
        }
        
        setDebugInfo(`Image loaded: ${width}x${height}`);
        
        // Store original image
        setOriginalImage(img);
        
        // Set canvas size
        setCanvasSize({ width, height });
        
        // Reset adjustments
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        setBlur(0);
        setGrayscale(0);
        setInvert(false);
        setSepia(0);
        setHueRotate(0);
        
        // Complete loading
        setImageLoaded(true);
        setUploading(false);
        
        // Draw the original image
        setTimeout(() => {
          drawOriginalImage();
        }, 100);
      };
      
      img.onerror = () => {
        setUploading(false);
        setDebugInfo('Error: Failed to load image');
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      setUploading(false);
      setDebugInfo('Error: Failed to read file');
    };
    
    reader.readAsDataURL(file);
  };
  
  // Draw the original image to canvas without any processing
  const drawOriginalImage = () => {
    if (!outputCanvasRef.current || !originalImage) {
      setDebugInfo('Error: Canvas or image not available');
      return;
    }
    
    const canvas = outputCanvasRef.current;
    
    try {
      // Set canvas dimensions
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDebugInfo('Error: Could not get canvas context');
        return;
      }
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw original image
      ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
      
      setDebugInfo('Original image drawn to canvas');
    } catch (e) {
      setDebugInfo(`Error drawing image: ${e}`);
    }
  };
  
  // Process all adjustments with direct pixel manipulation
  const processAdjustments = () => {
    if (!imageLoaded || !outputCanvasRef.current || !originalImage) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Create new timer with short delay
    timerRef.current = setTimeout(() => {
      try {
        setProcessing(true);
        setDebugInfo('Processing all adjustments...');
        
        const canvas = outputCanvasRef.current!;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setDebugInfo('Error: Could not get canvas context');
          setProcessing(false);
          return;
        }
        
        // Reset canvas and draw original image
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
          
          // Apply grayscale
          if (grayscale > 0) {
            const gray = 0.3 * r + 0.59 * g + 0.11 * b;
            r = r * (1 - grayscale/100) + gray * (grayscale/100);
            g = g * (1 - grayscale/100) + gray * (grayscale/100);
            b = b * (1 - grayscale/100) + gray * (grayscale/100);
          }
          
          // Apply sepia
          if (sepia > 0) {
            const sr = (r * 0.393) + (g * 0.769) + (b * 0.189);
            const sg = (r * 0.349) + (g * 0.686) + (b * 0.168);
            const sb = (r * 0.272) + (g * 0.534) + (b * 0.131);
            
            r = r * (1 - sepia/100) + sr * (sepia/100);
            g = g * (1 - sepia/100) + sg * (sepia/100);
            b = b * (1 - sepia/100) + sb * (sepia/100);
          }
          
          // Apply hue rotation
          if (hueRotate !== 0) {
            // Convert RGB to HSL
            const max = Math.max(r, g, b) / 255;
            const min = Math.min(r, g, b) / 255;
            const delta = max - min;
            
            let h = 0;
            const l = (max + min) / 2;
            const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
            
            if (delta !== 0) {
              if (max === r / 255) {
                h = ((g / 255 - b / 255) / delta) % 6;
              } else if (max === g / 255) {
                h = (b / 255 - r / 255) / delta + 2;
              } else {
                h = (r / 255 - g / 255) / delta + 4;
              }
              
              h = h * 60;
              if (h < 0) h += 360;
            }
            
            // Apply hue rotation
            h = (h + hueRotate) % 360;
            if (h < 0) h += 360;
            
            // HSL to RGB conversion
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            const m = l - c / 2;
            
            let r1, g1, b1;
            
            if (h >= 0 && h < 60) {
              [r1, g1, b1] = [c, x, 0];
            } else if (h >= 60 && h < 120) {
              [r1, g1, b1] = [x, c, 0];
            } else if (h >= 120 && h < 180) {
              [r1, g1, b1] = [0, c, x];
            } else if (h >= 180 && h < 240) {
              [r1, g1, b1] = [0, x, c];
            } else if (h >= 240 && h < 300) {
              [r1, g1, b1] = [x, 0, c];
            } else {
              [r1, g1, b1] = [c, 0, x];
            }
            
            r = (r1 + m) * 255;
            g = (g1 + m) * 255;
            b = (b1 + m) * 255;
          }
          
          // Apply brightness (add to each channel)
          if (brightness !== 0) {
            r += brightness;
            g += brightness;
            b += brightness;
          }
          
          // Apply contrast (adjust around midpoint)
          if (contrast !== 0) {
            const factor = (259 * (contrast + 100)) / (100 * (259 - contrast));
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;
          }
          
          // Apply saturation (weighted grayscale blend)
          if (saturation !== 0) {
            const gray = 0.3 * r + 0.59 * g + 0.11 * b;
            const satFactor = 1 + (saturation / 100);
            
            r = gray + satFactor * (r - gray);
            g = gray + satFactor * (g - gray);
            b = gray + satFactor * (b - gray);
          }
          
          // Apply invert
          if (invert) {
            r = 255 - r;
            g = 255 - g;
            b = 255 - b;
          }
          
          // Ensure values are in valid range
          data[i] = Math.max(0, Math.min(255, r));
          data[i + 1] = Math.max(0, Math.min(255, g));
          data[i + 2] = Math.max(0, Math.min(255, b));
          // Alpha (data[i + 3]) remains unchanged
        }
        
        // Put the modified image data back
        ctx.putImageData(imageData, 0, 0);
        
        // Apply blur if needed (as a separate step)
        if (blur > 0) {
          const radius = Math.max(1, Math.min(5, Math.ceil(blur / 20)));
          applyBoxBlur(radius);
        }
        
        setDebugInfo('All adjustments applied');
      } catch (e) {
        setDebugInfo(`Error processing adjustments: ${e}`);
        // Try to recover by drawing original image
        if (outputCanvasRef.current && originalImage) {
          const ctx = outputCanvasRef.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
            ctx.drawImage(originalImage, 0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
          }
        }
      } finally {
        setProcessing(false);
        timerRef.current = null;
      }
    }, 100);
  };
  
  // Apply box blur algorithm
  const applyBoxBlur = (radius: number) => {
    if (!outputCanvasRef.current) return;
    
    try {
      const canvas = outputCanvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      
      // Get current image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // Create a copy for processing
      const originalPixels = new Uint8ClampedArray(pixels);
      
      // Process blur in 2 passes (horizontal then vertical) for better performance
      // Horizontal pass
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0;
          let count = 0;
          
          // Sample horizontal pixels
          for (let i = -radius; i <= radius; i++) {
            const sampleX = Math.min(width - 1, Math.max(0, x + i));
            const idx = (y * width + sampleX) * 4;
            
            r += originalPixels[idx];
            g += originalPixels[idx + 1];
            b += originalPixels[idx + 2];
            count++;
          }
          
          // Set the pixel values
          const idx = (y * width + x) * 4;
          pixels[idx] = r / count;
          pixels[idx + 1] = g / count;
          pixels[idx + 2] = b / count;
          // Keep alpha as is
        }
      }
      
      // Copy the horizontal blur result for vertical pass
      const horizontalBlur = new Uint8ClampedArray(pixels);
      
      // Vertical pass
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          let r = 0, g = 0, b = 0;
          let count = 0;
          
          // Sample vertical pixels
          for (let j = -radius; j <= radius; j++) {
            const sampleY = Math.min(height - 1, Math.max(0, y + j));
            const idx = (sampleY * width + x) * 4;
            
            r += horizontalBlur[idx];
            g += horizontalBlur[idx + 1];
            b += horizontalBlur[idx + 2];
            count++;
          }
          
          // Set the pixel values
          const idx = (y * width + x) * 4;
          pixels[idx] = r / count;
          pixels[idx + 1] = g / count;
          pixels[idx + 2] = b / count;
          // Keep alpha as is
        }
      }
      
      // Put the blurred data back
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      setDebugInfo(`Error applying box blur: ${e}`);
    }
  };
  
  // Update when any adjustment parameter changes
  useEffect(() => {
    if (imageLoaded) {
      processAdjustments();
    }
  }, [brightness, contrast, saturation, blur, grayscale, invert, sepia, hueRotate, imageLoaded, canvasSize]);
  
  // Handle download
  const handleDownload = () => {
    if (!outputCanvasRef.current) {
      setDebugInfo('Error: Canvas not available for download');
      return;
    }
    
    try {
      // Get data URL from canvas
      const dataURL = outputCanvasRef.current.toDataURL('image/png');
      
      setDebugInfo('Preparing download...');
      
      if (isIOS) {
        // iOS approach: open in a new tab
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Simpan Gambar</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    margin: 0;
                    padding: 20px;
                    text-align: center;
                    background: #f7f7f7;
                  }
                  h3 {
                    margin-top: 0;
                    color: #333;
                  }
                  .image-container {
                    margin: 20px auto;
                    max-width: 100%;
                    background: white;
                    padding: 10px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  }
                  img {
                    max-width: 100%;
                    border-radius: 4px;
                  }
                  .instructions {
                    margin: 20px 0;
                    padding: 15px;
                    background: #e8f4ff;
                    border-radius: 8px;
                    text-align: left;
                    line-height: 1.5;
                  }
                  .instructions ol {
                    margin-bottom: 0;
                    padding-left: 20px;
                  }
                  .footer {
                    margin-top: 20px;
                    font-size: 0.8em;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <h3>Gambar Siap Disimpan</h3>
                <div class="image-container">
                  <img src="${dataURL}" alt="Gambar Hasil Edit">
                </div>
                <div class="instructions">
                  <strong>Untuk menyimpan gambar di perangkat iOS Anda:</strong>
                  <ol>
                    <li>Sentuh dan tahan gambar di atas</li>
                    <li>Ketuk "Tambahkan ke Foto" atau "Simpan Gambar"</li>
                  </ol>
                </div>
                <div class="footer">
                  Image Editor
                </div>
              </body>
            </html>
          `);
          newTab.document.close();
          setDebugInfo('Download page opened');
        } else {
          setDebugInfo('Error: Could not open download tab');
          alert('Mohon izinkan pop-up untuk melihat dan menyimpan gambar');
        }
      } else {
        // Standard approach for other browsers
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = dataURL;
        link.click();
        setDebugInfo('Download started');
      }
    } catch (error) {
      setDebugInfo(`Error downloading: ${error}`);
      alert('Terjadi kesalahan saat memproses gambar. Silakan coba lagi.');
    }
  };
  
  // Reset adjustment values
  const handleReset = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setBlur(0);
    setGrayscale(0);
    setInvert(false);
    setSepia(0);
    setHueRotate(0);
    
    // Redraw original image
    setTimeout(() => {
      drawOriginalImage();
    }, 100);
    
    setDebugInfo('All adjustments reset');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 dark:text-white">
            Editor Gambar
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Unggah gambar dan sesuaikan brightness, contrast, dan saturation dengan mudah
          </p>
          {isIOS && (
            <p className="text-xs text-orange-500 mt-1">Mode iOS Kompatibel</p>
          )}
          {/* Debug info for iOS troubleshooting */}
          <p className="text-xs text-gray-500 mt-1">{debugInfo}</p>
          {processing && (
            <p className="text-xs text-blue-500 mt-1 animate-pulse">Memproses gambar...</p>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Upload and Preview */}
          <div className="lg:col-span-7 space-y-6">
            <ImageUpload onImageUpload={handleImageUpload} />
            <ImagePreview 
              imageLoaded={imageLoaded}
              processing={uploading || processing}
              outputCanvasRef={outputCanvasRef}
              handleDownload={handleDownload}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              isIOS={isIOS} originalImage={null}            />
          </div>
          
          {/* Right panel - Adjustments */}
          <div className="lg:col-span-5">
            <ImageAdjustments
              brightness={brightness}
              contrast={contrast}
              saturation={saturation}
              blur={blur}
              grayscale={grayscale}
              invert={invert}
              sepia={sepia}
              hueRotate={hueRotate}
              setBrightness={setBrightness}
              setContrast={setContrast}
              setSaturation={setSaturation}
              setBlur={setBlur}
              setGrayscale={setGrayscale}
              setInvert={setInvert}
              setSepia={setSepia}
              setHueRotate={setHueRotate}
              handleReset={handleReset}
              imageLoaded={imageLoaded}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
'use client'

import React, { useState, useEffect, useRef } from 'react';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import ImageAdjustments from './ImageAdjustments';

const ImageEditor: React.FC = () => {
  // State for image and canvas
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  
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
  
  // Container ref for responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Detect iOS on component mount
  useEffect(() => {
    const detectIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    setIsIOS(detectIOS());
  }, []);
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    setUploading(true);
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target || typeof event.target.result !== 'string') {
        setUploading(false);
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Set maximum dimensions especially for iOS (to avoid memory issues)
        const MAX_DIMENSION = isIOS ? 1024 : 1200;
        
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
        
        // Store original image
        setOriginalImage(img);
        
        // Set canvas size
        setCanvasSize({ width, height });
        
        // Set state
        setImageLoaded(true);
        setUploading(false);
      };
      
      img.onerror = () => {
        setUploading(false);
      };
      
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };
  
  // Draw image to canvas with adjustments
  const drawImageToCanvas = () => {
    if (!outputCanvasRef.current || !originalImage) return;
    
    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original image
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // iOS-compatible image processing (direct pixel manipulation instead of filters)
    if (isIOS || !supportsFilters()) {
      applyAdjustmentsWithPixelManipulation(ctx, canvas.width, canvas.height);
    } else {
      // Non-iOS devices can use CSS filters for better performance
      applyAdjustmentsWithCSSFilters(ctx, canvas);
    }
  };
  
  // Check if the browser supports CSS filters
  const supportsFilters = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    return ctx && typeof ctx.filter !== 'undefined';
  };
  
  // Apply adjustments using direct pixel manipulation (iOS compatible)
  const applyAdjustmentsWithPixelManipulation = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Get image data
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Apply adjustments to each pixel
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
      
      // Apply brightness
      if (brightness !== 0) {
        r += brightness;
        g += brightness;
        b += brightness;
      }
      
      // Apply contrast
      if (contrast !== 0) {
        const factor = (259 * (contrast + 100)) / (100 * (259 - contrast));
        r = factor * (r - 128) + 128;
        g = factor * (g - 128) + 128;
        b = factor * (b - 128) + 128;
      }
      
      // Apply saturation
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
      
      // Apply blur (not implemented in pixel manipulation - too complex)
      // For blur, we would need a convolution matrix which is complex to implement pixel by pixel
      
      // Apply hue rotation (simplified implementation)
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
        
        // Convert back to RGB
        function hslToRgb(h: number, s: number, l: number) {
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const x = c * (1 - Math.abs((h / 60) % 2 - 1));
          const m = l - c / 2;
          let r1 = 0, g1 = 0, b1 = 0;
          
          if (h >= 0 && h < 60) {
            r1 = c; g1 = x; b1 = 0;
          } else if (h >= 60 && h < 120) {
            r1 = x; g1 = c; b1 = 0;
          } else if (h >= 120 && h < 180) {
            r1 = 0; g1 = c; b1 = x;
          } else if (h >= 180 && h < 240) {
            r1 = 0; g1 = x; b1 = c;
          } else if (h >= 240 && h < 300) {
            r1 = x; g1 = 0; b1 = c;
          } else {
            r1 = c; g1 = 0; b1 = x;
          }
          
          return [
            Math.round((r1 + m) * 255),
            Math.round((g1 + m) * 255),
            Math.round((b1 + m) * 255)
          ];
        }
        
        const rgb = hslToRgb(h, s, l);
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
      }
      
      // Ensure values are within valid range
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
    
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
  };
  
  // Apply adjustments using CSS filters (non-iOS)
  const applyAdjustmentsWithCSSFilters = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) => {
    // Create a temporary canvas for the original image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Draw original image to temp canvas
    tempCtx.drawImage(originalImage!, 0, 0, canvas.width, canvas.height);
    
    // Build CSS filter string
    const filters = [];
    
    if (brightness !== 0) {
      const brightnessValue = 1 + (brightness / 100);
      filters.push(`brightness(${brightnessValue.toFixed(2)})`);
    }
    
    if (contrast !== 0) {
      const contrastValue = 1 + (contrast / 100);
      filters.push(`contrast(${contrastValue.toFixed(2)})`);
    }
    
    if (saturation !== 0) {
      const saturationValue = 1 + (saturation / 100);
      filters.push(`saturate(${saturationValue.toFixed(2)})`);
    }
    
    if (blur > 0) {
      filters.push(`blur(${blur / 10}px)`);
    }
    
    if (grayscale > 0) {
      filters.push(`grayscale(${grayscale / 100})`);
    }
    
    if (sepia > 0) {
      filters.push(`sepia(${sepia / 100})`);
    }
    
    if (hueRotate !== 0) {
      filters.push(`hue-rotate(${hueRotate}deg)`);
    }
    
    if (invert) {
      filters.push('invert(1)');
    }
    
    // Apply filters
    if (filters.length > 0) {
      // Clear main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply filters and draw from temp canvas to main canvas
      ctx.filter = filters.join(' ');
      ctx.drawImage(tempCanvas, 0, 0);
      
      // Reset filter
      ctx.filter = 'none';
    }
  };
  
  // Update canvas when parameters change
  useEffect(() => {
    if (imageLoaded && canvasSize.width > 0 && canvasSize.height > 0) {
      drawImageToCanvas();
    }
  }, [
    brightness, 
    contrast, 
    saturation, 
    blur, 
    grayscale, 
    invert, 
    sepia, 
    hueRotate, 
    imageLoaded, 
    canvasSize,
    isIOS
  ]);
  
  // Handle download with iOS compatibility
  const handleDownload = () => {
    if (!outputCanvasRef.current) return;
    
    try {
      // Get data URL from canvas
      const dataURL = outputCanvasRef.current.toDataURL('image/png');
      
      if (isIOS) {
        // iOS approach: open in new tab
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`<img src="${dataURL}" alt="Processed Image" style="max-width: 100%;">`);
          newTab.document.title = 'Processed Image';
          newTab.document.close();
        } else {
          alert('Please allow pop-ups to download the image');
        }
      } else {
        // Standard approach for other browsers
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = dataURL;
        link.click();
      }
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('There was an error downloading the image. Please try again.');
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
            <p className="text-xs mt-2 text-orange-500">
              iOS Mode: Using compatible image processing
            </p>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Upload and Preview */}
          <div className="lg:col-span-7 space-y-6">
            <ImageUpload onImageUpload={handleImageUpload} />
            <div ref={containerRef}>
              <ImagePreview 
                imageLoaded={imageLoaded}
                processing={uploading}
                outputCanvasRef={outputCanvasRef}
                handleDownload={handleDownload}
                originalImage={originalImage}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                isIOS={isIOS}
              />
            </div>
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
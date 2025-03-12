'use client'

import React, { useState, useEffect, useRef } from 'react';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import ImageAdjustments from './ImageAdjustments';
// import { AdjustmentParams } from '../types';

const ImageEditor: React.FC = () => {
  // State for image and canvas
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Adjustment parameters
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [invert, setInvert] = useState<boolean>(false);
  const [sepia, setSepia] = useState<number>(0);
  const [hueRotate, setHueRotate] = useState<number>(0);
  
  // Canvas ref - we'll use just one canvas
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Container ref for responsive sizing
  const containerRef = useRef<HTMLDivElement>(null);
  
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
        // Store original image
        setOriginalImage(img);
        
        // Calculate best size for canvas based on container and image aspect ratio
        calculateOptimalCanvasSize(img);
        
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
  
  // Calculate optimal canvas size based on container and image
  const calculateOptimalCanvasSize = (img: HTMLImageElement) => {
    if (!containerRef.current) return;
    
    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = 400; // Default max height
    
    // Calculate aspect ratio
    const aspectRatio = img.width / img.height;
    
    // Calculate optimal dimensions
    let width, height;
    
    if (aspectRatio > 1) {
      // Landscape
      width = Math.min(containerWidth, 600); // Limit max width
      height = width / aspectRatio;
    } else {
      // Portrait
      height = Math.min(containerHeight, 400); // Limit max height
      width = height * aspectRatio;
    }
    
    // Set canvas size
    setCanvasSize({
      width: Math.round(width),
      height: Math.round(height)
    });
  };
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (originalImage) {
        calculateOptimalCanvasSize(originalImage);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [originalImage]);
  
  // Draw image to canvas
  const drawImageToCanvas = () => {
    if (!outputCanvasRef.current || !originalImage) return;
    
    const canvas = outputCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    
    // Clear canvas and reset filters
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';
    
    // Draw original image proportionally to fill canvas
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    
    // Build CSS filter string
    const filters = [];
    
    if (brightness !== 0) {
      // Convert from -100...100 to 0...2
      const brightnessValue = 1 + (brightness / 100);
      filters.push(`brightness(${brightnessValue.toFixed(2)})`);
    }
    
    if (contrast !== 0) {
      // Convert from -100...100 to 0...2
      const contrastValue = 1 + (contrast / 100);
      filters.push(`contrast(${contrastValue.toFixed(2)})`);
    }
    
    if (saturation !== 0) {
      // Convert from -100...100 to 0...2
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
    
    // Apply filters and redraw
    if (filters.length > 0) {
      // Create temporary canvas for the original image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Draw original image to temp canvas
        tempCtx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
        
        // Clear main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply filters and draw from temp canvas to main canvas
        ctx.filter = filters.join(' ');
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  };
  
  // Update canvas when canvas size changes
  useEffect(() => {
    if (canvasSize.width > 0 && canvasSize.height > 0) {
      drawImageToCanvas();
    }
  }, [canvasSize]);
  
  // Re-apply filters when adjustments change
  useEffect(() => {
    if (imageLoaded && canvasSize.width > 0 && canvasSize.height > 0) {
      drawImageToCanvas();
    }
  }, [brightness, contrast, saturation, blur, grayscale, invert, sepia, hueRotate, imageLoaded]);
  
  // Handle download
  const handleDownload = () => {
    if (!outputCanvasRef.current) return;
    
    // For downloading, we want the full resolution
    if (originalImage) {
      // Create a temporary canvas at original image resolution
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalImage.width;
      tempCanvas.height = originalImage.height;
      
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // Draw original image
        tempCtx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);
        
        // Apply filters
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
          // Scale blur based on resolution
          const scaleFactor = originalImage.width / canvasSize.width;
          filters.push(`blur(${(blur / 10) * scaleFactor}px)`);
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
        
        if (filters.length > 0) {
          // Create another canvas for filtered version
          const filteredCanvas = document.createElement('canvas');
          filteredCanvas.width = originalImage.width;
          filteredCanvas.height = originalImage.height;
          
          const filteredCtx = filteredCanvas.getContext('2d');
          if (filteredCtx) {
            // Apply filters
            filteredCtx.filter = filters.join(' ');
            filteredCtx.drawImage(tempCanvas, 0, 0);
            
            // Download the filtered version
            const link = document.createElement('a');
            link.download = 'edited-image.png';
            link.href = filteredCanvas.toDataURL('image/png');
            link.click();
            return;
          }
        }
      }
    }
    
    // Fallback to current canvas if high-res processing fails
    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = outputCanvasRef.current.toDataURL('image/png');
    link.click();
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
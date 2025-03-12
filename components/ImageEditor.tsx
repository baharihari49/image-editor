'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ImageUpload from './ImageUpload';
import ImagePreview from './ImagePreview';
import ImageAdjustments from './ImageAdjustments';
import { AdjustmentParams } from '../types';
import { loadOpenCV, processImageWithOpenCV } from '../utils/opencv';

const ImageEditor: React.FC = () => {
  // State for image and canvas
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [uploading, setUploading] = useState<boolean>(false); // Only for upload loading
  const [adjusting, setAdjusting] = useState<boolean>(false); // For tracking adjustments
  
  // Adjustment parameters
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [saturation, setSaturation] = useState<number>(0);
  
  // Refs to prevent unnecessary re-renders
  const lastAdjustmentRef = useRef<AdjustmentParams>({
    brightness: 0,
    contrast: 0,
    saturation: 0
  });
  const adjustingRef = useRef<boolean>(false);
  const inputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  // OpenCV loaded flag - using ref to avoid re-renders
  const [cvLoaded, setCvLoaded] = useState<boolean>(false);
  const cvLoadedRef = useRef<boolean>(false);
  
  // Load OpenCV.js - only runs once
  useEffect(() => {
    let unmounted = false;
    
    const initOpenCV = async () => {
      try {
        const loaded = await loadOpenCV();
        if (!unmounted) {
          setCvLoaded(loaded);
          cvLoadedRef.current = loaded;
          console.log('OpenCV loaded status:', loaded);
        }
      } catch (error) {
        console.error('Error loading OpenCV:', error);
      }
    };
    
    initOpenCV();
    
    return () => {
      unmounted = true;
    };
  }, []);
  
  // Update refs when state changes to avoid dependency issues
  useEffect(() => {
    originalImageRef.current = originalImage;
  }, [originalImage]);
  
  useEffect(() => {
    adjustingRef.current = adjusting;
  }, [adjusting]);
  
  // Centralized image processing function
  const processImage = useCallback(() => {
    // Avoid processing if already in progress
    if (adjustingRef.current) {
      console.log('Skipping process - already in progress');
      return;
    }
    
    // Avoid processing if required conditions are not met
    if (!imageLoaded || !cvLoadedRef.current || !window.cv || !originalImageRef.current) {
      console.log('Skipping process - prerequisites not met', {
        imageLoaded,
        cvLoaded: cvLoadedRef.current,
        hasCV: Boolean(window.cv),
        hasOriginalImage: Boolean(originalImageRef.current)
      });
      return;
    }
    
    console.log('Starting image processing');
    
    // Save current parameters to ref
    lastAdjustmentRef.current = {
      brightness,
      contrast,
      saturation
    };
    
    // Mark as adjusting (but don't show loading overlay)
    setAdjusting(true);
    adjustingRef.current = true;
    
    try {
      // Redraw original image to input canvas
      if (inputCanvasRef.current && originalImageRef.current) {
        const inputCtx = inputCanvasRef.current.getContext('2d');
        if (inputCtx) {
          inputCtx.clearRect(0, 0, inputCanvasRef.current.width, inputCanvasRef.current.height);
          inputCtx.drawImage(
            originalImageRef.current, 
            0, 0, 
            inputCanvasRef.current.width, 
            inputCanvasRef.current.height
          );
          
          // Process with OpenCV after small delay
          setTimeout(() => {
            try {
              if (inputCanvasRef.current && outputCanvasRef.current) {
                const success = processImageWithOpenCV(
                  inputCanvasRef.current,
                  outputCanvasRef.current,
                  {
                    brightness,
                    contrast,
                    saturation
                  }
                );
                
                // Fall back to original image if processing fails
                if (!success && outputCanvasRef.current && originalImageRef.current) {
                  const outCtx = outputCanvasRef.current.getContext('2d');
                  if (outCtx) {
                    outCtx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
                    outCtx.drawImage(
                      originalImageRef.current,
                      0, 0,
                      outputCanvasRef.current.width,
                      outputCanvasRef.current.height
                    );
                  }
                }
              }
            } catch (err) {
              console.error('OpenCV processing error:', err);
              
              // Fallback to original image
              if (outputCanvasRef.current && originalImageRef.current) {
                const outCtx = outputCanvasRef.current.getContext('2d');
                if (outCtx) {
                  outCtx.clearRect(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
                  outCtx.drawImage(
                    originalImageRef.current,
                    0, 0,
                    outputCanvasRef.current.width,
                    outputCanvasRef.current.height
                  );
                }
              }
            } finally {
              // End adjusting
              adjustingRef.current = false;
              setAdjusting(false);
            }
          }, 100);
        } else {
          console.error('Could not get input canvas context');
          adjustingRef.current = false;
          setAdjusting(false);
        }
      } else {
        console.error('Input canvas or original image is null');
        adjustingRef.current = false;
        setAdjusting(false);
      }
    } catch (err) {
      console.error('General processing error:', err);
      adjustingRef.current = false;
      setAdjusting(false);
    }
  }, [brightness, contrast, saturation, imageLoaded]);
  
  // Handle image upload - fully decoupled
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    // Set uploading state
    setUploading(true);
    
    reader.onload = (event: ProgressEvent<FileReader>) => {
      if (!event.target || typeof event.target.result !== 'string') {
        setUploading(false);
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Scale dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          } else {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        
        // Minimum dimensions
        width = Math.max(width, 1);
        height = Math.max(height, 1);
        
        // Setup canvases
        if (inputCanvasRef.current) {
          inputCanvasRef.current.width = width;
          inputCanvasRef.current.height = height;
        }
        
        if (outputCanvasRef.current) {
          outputCanvasRef.current.width = width;
          outputCanvasRef.current.height = height;
        }
        
        // Draw initial image to output canvas directly
        if (outputCanvasRef.current) {
          const outCtx = outputCanvasRef.current.getContext('2d');
          if (outCtx) {
            outCtx.clearRect(0, 0, width, height);
            outCtx.drawImage(img, 0, 0, width, height);
          }
        }
        
        // Reset adjustment values
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        
        // Store original image and mark loaded
        setOriginalImage(img);
        originalImageRef.current = img;
        
        // Complete loading process
        setImageLoaded(true);
        setUploading(false);
        
        // Schedule one-time processing with default values
        if (cvLoadedRef.current && window.cv) {
          // Add slight delay to ensure all state updates are complete
          setTimeout(() => {
            if (!adjustingRef.current) {
              processImage();
            }
          }, 500);
        }
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
  }, [processImage]);
  
  // Only process when slider values change, with debounce
  useEffect(() => {
    if (!imageLoaded || adjustingRef.current) return;
    
    // Skip if no changes
    if (
      brightness === lastAdjustmentRef.current.brightness &&
      contrast === lastAdjustmentRef.current.contrast &&
      saturation === lastAdjustmentRef.current.saturation
    ) {
      return;
    }
    
    // Debounce processing
    const timer = setTimeout(() => {
      if (!adjustingRef.current) {
        processImage();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [brightness, contrast, saturation, imageLoaded, processImage]);
  
  // Process once when OpenCV becomes available after image
  useEffect(() => {
    if (cvLoaded && imageLoaded && !adjustingRef.current) {
      // Small delay to ensure state is stable
      const timer = setTimeout(() => {
        if (!adjustingRef.current) {
          processImage();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [cvLoaded, imageLoaded, processImage]);
  
  // Download handler
  const handleDownload = useCallback(() => {
    if (!imageLoaded || !outputCanvasRef.current) return;
    
    try {
      const link = document.createElement('a');
      link.download = 'processed-image.png';
      link.href = outputCanvasRef.current.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
      
      // Fallback to original image
      if (originalImageRef.current) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = originalImageRef.current.width;
        tempCanvas.height = originalImageRef.current.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(originalImageRef.current, 0, 0);
          const link = document.createElement('a');
          link.download = 'original-image.png';
          link.href = tempCanvas.toDataURL('image/png');
          link.click();
        }
      }
    }
  }, [imageLoaded]);
  
  // Reset adjustment values
  const handleReset = useCallback(() => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  }, []);
  
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
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left panel - Upload and Preview */}
          <div className="lg:col-span-7 space-y-6">
            <ImageUpload onImageUpload={handleImageUpload} />
            <ImagePreview 
              imageLoaded={imageLoaded}
              processing={uploading} // Only show loading during upload, not adjustments
              outputCanvasRef={outputCanvasRef}
              handleDownload={handleDownload}
              originalImage={originalImage}
            />
          </div>
          
          {/* Right panel - Adjustments */}
          <div className="lg:col-span-5">
            <ImageAdjustments
              brightness={brightness}
              contrast={contrast}
              saturation={saturation}
              setBrightness={setBrightness}
              setContrast={setContrast}
              setSaturation={setSaturation}
              handleReset={handleReset}
              imageLoaded={imageLoaded}
            />
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

export default ImageEditor;
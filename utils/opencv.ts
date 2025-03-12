import { AdjustmentParams } from '../types';

// Variabel untuk melacak status pemuatan OpenCV.js
let isOpenCVLoading = false;
let openCVLoadingPromise: Promise<boolean> | null = null;

// Load OpenCV.js script dynamically
export const loadOpenCV = (): Promise<boolean> => {
  // Jika OpenCV sudah tersedia di window, cukup kembalikan true
  if (window.cv) {
    console.log('OpenCV already available in window');
    return Promise.resolve(true);
  }
  
  // Jika sedang dalam proses loading, gunakan promise yang ada
  if (isOpenCVLoading && openCVLoadingPromise) {
    console.log('OpenCV already loading, reusing promise');
    return openCVLoadingPromise;
  }
  
  // Periksa apakah script OpenCV sudah ada di document
  const existingScript = document.querySelector('script[src*="opencv.js"]');
  if (existingScript) {
    console.log('OpenCV script tag already exists in document');
    return new Promise((resolve) => {
      // Periksa apakah window.cv sudah tersedia setiap 100ms
      const checkCV = setInterval(() => {
        if (window.cv) {
          clearInterval(checkCV);
          resolve(true);
        }
      }, 100);
      
      // Batasi waktu pemeriksaan ke 10 detik
      setTimeout(() => {
        clearInterval(checkCV);
        if (!window.cv) {
          console.error('Timed out waiting for existing OpenCV script to load');
          resolve(false);
        }
      }, 10000);
    });
  }
  
  // Tandai bahwa kita sedang memuat OpenCV
  isOpenCVLoading = true;
  
  // Buat promise baru untuk pemuatan
  openCVLoadingPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
    script.async = true;
    script.id = 'opencv-script';
    
    script.onerror = () => {
      console.error('Failed to load OpenCV.js');
      
      // Pastikan tidak ada script fallback yang sudah ada
      if (document.querySelector('script[src*="cloudflare"]')) {
        console.log('Fallback script already exists');
        isOpenCVLoading = false;
        resolve(false);
        return;
      }
      
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/opencv.js/3.4.0/opencv.js';
      fallbackScript.async = true;
      fallbackScript.id = 'opencv-fallback-script';
      
      fallbackScript.onload = () => {
        console.log('OpenCV.js loaded from fallback source');
        isOpenCVLoading = false;
        resolve(true);
      };
      
      fallbackScript.onerror = () => {
        console.error('Failed to load OpenCV.js from fallback source');
        isOpenCVLoading = false;
        resolve(false);
      };
      
      document.body.appendChild(fallbackScript);
    };
    
    script.onload = () => {
      console.log('OpenCV.js loaded successfully');
      isOpenCVLoading = false;
      resolve(true);
    };
    
    document.body.appendChild(script);
  });
  
  return openCVLoadingPromise;
};

// Process image with OpenCV
export const processImageWithOpenCV = (
  inputCanvas: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  params: AdjustmentParams
): boolean => {
  if (!window.cv) {
    console.error('OpenCV is not loaded');
    return false;
  }
  
  // Verifikasi canvas
  if (!inputCanvas || !outputCanvas) {
    console.error('Canvas tidak valid');
    return false;
  }
  
  // Periksa dimensi canvas
  if (inputCanvas.width === 0 || inputCanvas.height === 0) {
    console.error('Canvas input memiliki dimensi nol');
    return false;
  }
  
  // Periksa jika context dan data gambar ada
  const ctx = inputCanvas.getContext('2d');
  if (!ctx) {
    console.error('Tidak dapat mendapatkan context canvas input');
    return false;
  }
  
  try {
    // Periksa data piksel di canvas
    try {
      const imageData = ctx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
      if (!imageData || imageData.data.length === 0) {
        console.error('Tidak ada data gambar di canvas');
        return false;
      }
    } catch (e) {
      console.error('Error saat memeriksa data gambar:', e);
      return false;
    }
    
    console.log('Memulai pemrosesan gambar dengan dimensi canvas:', 
      inputCanvas.width, 'x', inputCanvas.height);
    
    // Baca gambar input dari canvas - gunakan try/catch terpisah
    let src;
    try {
      src = window.cv.imread(inputCanvas);
    } catch (e) {
      console.error('Error saat membaca gambar dari canvas:', e);
      return false;
    }
    
    const dst = new window.cv.Mat();
    
    console.log('Image read from canvas:', {
      width: src.cols,
      height: src.rows,
      channels: src.channels()
    });
    
    // Apply brightness and contrast adjustments
    // alpha controls contrast, beta controls brightness
    const alpha = (params.contrast / 100) + 1; // Range: 0.0 to 2.0
    const beta = params.brightness; // Range: -100 to 100
    
    window.cv.convertScaleAbs(src, dst, alpha, beta);
    
    // Apply saturation adjustment (if not zero)
    if (params.saturation !== 0) {
      // Convert to HSV for saturation adjustment
      const hsv = new window.cv.Mat();
      window.cv.cvtColor(dst, hsv, window.cv.COLOR_RGB2HSV);
      
      // Split the HSV channels
      const channels = new window.cv.MatVector();
      window.cv.split(hsv, channels);
      
      // Adjust saturation channel
      const saturationScale = (params.saturation / 100) + 1; // Range: 0.0 to 2.0
      channels.get(1).convertTo(channels.get(1), -1, saturationScale, 0);
      
      // Merge the channels back
      window.cv.merge(channels, hsv);
      
      // Convert back to RGB
      window.cv.cvtColor(hsv, dst, window.cv.COLOR_HSV2RGB);
      
      // Free memory
      hsv.delete();
      channels.delete();
    }
    
    // Display result on output canvas
    window.cv.imshow(outputCanvas, dst);
    
    console.log('Image processing complete');
    
    // Clean up
    src.delete();
    dst.delete();
    
    return true;
  } catch (err) {
    console.error('Error processing image:', err);
    return false;
  }
};
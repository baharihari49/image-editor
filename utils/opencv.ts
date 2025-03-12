import { AdjustmentParams } from '../types';

// Variables to track OpenCV.js loading status
let isOpenCVLoading = false;
let openCVLoadingPromise: Promise<boolean> | null = null;

/**
 * Loads the OpenCV.js library from CDN with fallback support
 * @returns Promise that resolves to true if OpenCV loaded successfully
 */
export const loadOpenCV = (): Promise<boolean> => {
  // If OpenCV is already available in the window, just return true
  if (window.cv) {
    console.log('OpenCV already available in window');
    return Promise.resolve(true);
  }

  // If we're already loading, return the existing promise
  if (isOpenCVLoading && openCVLoadingPromise) {
    console.log('OpenCV already loading, reusing promise');
    return openCVLoadingPromise;
  }
  
  // Clean up any previous failed loading attempts
  const cleanup = () => {
    const existingScripts = document.querySelectorAll('script[src*="opencv.js"]');
    existingScripts.forEach(script => script.remove());
  };
  
  cleanup();
  
  // Mark as loading
  isOpenCVLoading = true;
  
  // Create new promise for loading
  openCVLoadingPromise = new Promise((resolve) => {
    // Load from primary CDN
    const loadFromPrimaryCDN = () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/opencv.js@1.2.1/opencv.min.js';
      script.async = true;
      script.id = 'opencv-script';
      
      let timeoutId: number | undefined;
      
      // Handle successful loading
      script.onload = () => {
        console.log('OpenCV.js loaded successfully from primary source');
        if (timeoutId) clearTimeout(timeoutId);
        isOpenCVLoading = false;
        resolve(true);
      };
      
      // Handle loading error
      script.onerror = () => {
        console.error('Failed to load OpenCV.js from primary source');
        if (timeoutId) clearTimeout(timeoutId);
        // Try fallback CDN
        loadFromFallbackCDN();
      };
      
      // Set timeout for primary loading
      timeoutId = window.setTimeout(() => {
        console.error('OpenCV loading timed out from primary source');
        // if (!window.cv) {
        //   // Call onerror without arguments to avoid the TypeScript error
        //   script.onerror();
        // }
      }, 15000);
      
      document.body.appendChild(script);
    };
    
    // Load from fallback CDN
    const loadFromFallbackCDN = () => {
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://docs.opencv.org/4.5.5/opencv.js';
      fallbackScript.async = true;
      fallbackScript.id = 'opencv-fallback-script';
      
      let fallbackTimeoutId: number | undefined;
      
      // Handle successful loading from fallback
      fallbackScript.onload = () => {
        console.log('OpenCV.js loaded from fallback source');
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
        isOpenCVLoading = false;
        resolve(true);
      };
      
      // Handle fallback loading error
      fallbackScript.onerror = () => {
        console.error('Failed to load OpenCV.js from fallback source');
        if (fallbackTimeoutId) clearTimeout(fallbackTimeoutId);
        isOpenCVLoading = false;
        resolve(false);
      };
      
      // Set timeout for fallback loading
      fallbackTimeoutId = window.setTimeout(() => {
        console.error('Fallback OpenCV loading timed out');
        isOpenCVLoading = false;
        resolve(false);
      }, 15000);
      
      document.body.appendChild(fallbackScript);
    };
    
    // Start loading process
    loadFromPrimaryCDN();
  });
  
  return openCVLoadingPromise;
};

/**
 * Process an image using OpenCV with various adjustments
 * @param inputCanvas Canvas containing the source image
 * @param outputCanvas Canvas where the processed image will be displayed
 * @param params Adjustment parameters for image processing
 * @param originalImage Original image for fallback
 * @returns boolean indicating success or failure
 */
export const processImageWithOpenCV = (
  inputCanvas: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  params: AdjustmentParams,
  originalImage: HTMLImageElement | null
): boolean => {
  // Ensure OpenCV is loaded
  if (!window.cv) {
    console.error('OpenCV is not loaded');
    return fallbackToOriginal(outputCanvas, originalImage);
  }

  // Validate canvas dimensions
  if (inputCanvas.width <= 0 || inputCanvas.height <= 0) {
    console.error('Input canvas has invalid dimensions');
    return fallbackToOriginal(outputCanvas, originalImage);
  }

  try {
    // Prepare input canvas with original image
    prepareInputCanvas(inputCanvas, originalImage);

    // Read image from input canvas
    const src = window.cv.imread(inputCanvas);
    if (!src || src.empty()) {
      console.error('Source image is empty or invalid');
      src?.delete();
      return fallbackToOriginal(outputCanvas, originalImage);
    }

    // Create destination matrix
    const dst = new window.cv.Mat();
    src.copyTo(dst);

    // Apply image processing effects in sequence
    try {
      // Apply effects in a specific order for best results
      if (params.grayscale > 0) applyGrayscale(dst, params.grayscale);
      if (params.blur > 0) applyBlur(dst, params.blur);
      if (params.invert) applyInvert(dst);
      if (params.sepia > 0) applySepia(dst, params.sepia);
      
      // Apply brightness and contrast
      applyBrightnessContrast(dst, params.brightness, params.contrast);
      
      // Apply saturation and hue adjustments (must be done together)
      if (params.saturation !== 0 || params.hueRotate !== 0) {
        applySaturationAndHue(dst, params.saturation, params.hueRotate);
      }
      
      // Display the result on the output canvas
      window.cv.imshow(outputCanvas, dst);
      
      // Check if output is valid (not all black)
      if (isCanvasBlack(outputCanvas)) {
        console.warn('Output canvas is all black, using original image as fallback');
        fallbackToOriginal(outputCanvas, originalImage);
      }
    } catch (e) {
      console.error('Error during image processing:', e);
      fallbackToOriginal(outputCanvas, originalImage);
    } finally {
      // Always clean up OpenCV matrices
      src.delete();
      dst.delete();
    }

    return true;
  } catch (err) {
    console.error('Error in processImageWithOpenCV:', err);
    return fallbackToOriginal(outputCanvas, originalImage);
  }
};

/**
 * Download the processed image from a canvas
 */
export const downloadImageFromCanvas = (
  canvas: HTMLCanvasElement, 
  filename: string = 'processed-image.png'
): boolean => {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
};

// HELPER FUNCTIONS

/**
 * Draw the original image on the input canvas
 */
function prepareInputCanvas(
  canvas: HTMLCanvasElement, 
  originalImage: HTMLImageElement | null
): void {
  if (!originalImage) return;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  }
}

/**
 * Fall back to displaying the original image when processing fails
 */
function fallbackToOriginal(
  canvas: HTMLCanvasElement, 
  originalImage: HTMLImageElement | null
): boolean {
  if (!originalImage) return false;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  }
  
  return false;
}

/**
 * Check if a canvas is entirely black (empty)
 */
function isCanvasBlack(canvas: HTMLCanvasElement): boolean {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check for non-black pixels
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== 0 || data[i+1] !== 0 || data[i+2] !== 0) {
        return false;
      }
    }
    
    return true; // All pixels are black
  } catch (e) {
    console.error('Error checking if canvas is black:', e);
    return false; // Assume not black on error
  }
}

// IMAGE PROCESSING FUNCTIONS

/**
 * Apply grayscale effect to an image
 */
function applyGrayscale(dst: any, intensity: number): void {
  try {
    // Convert to grayscale
    const gray = new window.cv.Mat();
    window.cv.cvtColor(dst, gray, window.cv.COLOR_RGBA2GRAY);
    window.cv.cvtColor(gray, gray, window.cv.COLOR_GRAY2RGBA);
    
    // Blend between original and grayscale based on intensity
    if (intensity < 100) {
      const alpha = intensity / 100;
      const beta = 1 - alpha;
      window.cv.addWeighted(gray, alpha, dst, beta, 0, dst);
    } else {
      gray.copyTo(dst);
    }
    
    gray.delete();
  } catch (e) {
    console.error('Error applying grayscale:', e);
  }
}

/**
 * Apply Gaussian blur to an image
 */
function applyBlur(dst: any, intensity: number): void {
  try {
    // Ensure blur size is odd (required by Gaussian blur)
    const blurSize = Math.max(1, Math.floor(intensity / 10)) * 2 + 1;
    const tempMat = new window.cv.Mat();
    
    window.cv.GaussianBlur(
      dst, 
      tempMat, 
      new window.cv.Size(blurSize, blurSize), 
      0
    );
    
    tempMat.copyTo(dst);
    tempMat.delete();
  } catch (e) {
    console.error('Error applying blur:', e);
  }
}

/**
 * Invert colors of an image
 */
function applyInvert(dst: any): void {
  try {
    window.cv.bitwise_not(dst, dst);
  } catch (e) {
    console.error('Error applying invert:', e);
  }
}

/**
 * Apply sepia tone effect to an image
 */
function applySepia(dst: any, intensity: number): void {
  try {
    // Create temporary matrices for sepia effect
    const tempRed = new window.cv.Mat();
    const tempGreen = new window.cv.Mat();
    const tempBlue = new window.cv.Mat();
    
    // Apply sepia coefficients
    window.cv.convertScaleAbs(dst, tempRed, 0.393, 0);   // Red influence
    window.cv.convertScaleAbs(dst, tempGreen, 0.769, 0); // Green influence
    window.cv.convertScaleAbs(dst, tempBlue, 0.189, 0);  // Blue influence
    
    // Combine the weighted channels
    const sepiaMat = new window.cv.Mat();
    dst.copyTo(sepiaMat);
    
    window.cv.addWeighted(tempRed, 0.4, tempGreen, 0.4, 0, sepiaMat);
    window.cv.addWeighted(sepiaMat, 0.8, tempBlue, 0.2, 0, sepiaMat);
    
    // Blend with original based on intensity
    if (intensity < 100) {
      const alpha = intensity / 100;
      const beta = 1 - alpha;
      window.cv.addWeighted(sepiaMat, alpha, dst, beta, 0, dst);
    } else {
      sepiaMat.copyTo(dst);
    }
    
    // Cleanup
    tempRed.delete();
    tempGreen.delete();
    tempBlue.delete();
    sepiaMat.delete();
  } catch (e) {
    console.error('Error applying sepia effect:', e);
  }
}

/**
 * Apply brightness and contrast adjustments
 */
function applyBrightnessContrast(dst: any, brightness: number, contrast: number): void {
  try {
    // Skip if no adjustment needed
    if (brightness === 0 && contrast === 0) return;
    
    // Convert parameters to OpenCV-friendly values
    const alpha = (contrast / 100) + 1; // Range: 0.0 to 2.0 (1.0 is neutral)
    const beta = brightness;            // Range: -100 to 100 (0 is neutral)
    
    const tempMat = new window.cv.Mat();
    window.cv.convertScaleAbs(dst, tempMat, alpha, beta);
    tempMat.copyTo(dst);
    tempMat.delete();
  } catch (e) {
    console.error('Error applying brightness/contrast:', e);
  }
}

/**
 * Apply saturation and hue rotation adjustments
 */
function applySaturationAndHue(dst: any, saturation: number, hueRotate: number): void {
  try {
    // Convert to HSV for saturation and hue adjustment
    const hsv = new window.cv.Mat();
    window.cv.cvtColor(dst, hsv, window.cv.COLOR_RGB2HSV);
    
    // Split channels (H, S, V)
    const channels = new window.cv.MatVector();
    window.cv.split(hsv, channels);
    
    // Make sure we have the expected number of channels
    if (channels.size() >= 3) {
      // Apply hue rotation if needed
      if (hueRotate !== 0) {
        applyHueRotation(channels.get(0), hueRotate);
      }
      
      // Apply saturation if needed
      if (saturation !== 0) {
        applySaturation(channels.get(1), saturation);
      }
      
      // Merge channels back
      window.cv.merge(channels, hsv);
      
      // Convert back to RGB
      window.cv.cvtColor(hsv, dst, window.cv.COLOR_HSV2RGB);
    } else {
      console.error('Expected at least 3 channels for HSV image');
    }
    
    // Cleanup
    hsv.delete();
    channels.delete();
  } catch (e) {
    console.error('Error during saturation/hue processing:', e);
  }
}

/**
 * Apply hue rotation to the hue channel
 */
function applyHueRotation(hueChannel: any, hueRotate: number): void {
  try {
    const hueData = hueChannel.data;
    
    // Hue values in OpenCV are in range 0-180
    const hueShift = Math.round((hueRotate / 360) * 180);
    
    // Apply hue rotation to each pixel
    for (let i = 0; i < hueData.length; i++) {
      // Add shift and ensure value stays in 0-180 range
      let newHue = (hueData[i] + hueShift) % 180;
      if (newHue < 0) newHue += 180;
      hueData[i] = newHue;
    }
  } catch (e) {
    console.error('Error applying hue rotation:', e);
  }
}

/**
 * Apply saturation adjustment to the saturation channel
 */
function applySaturation(saturationChannel: any, saturation: number): void {
  try {
    // Convert from -100...100 to 0...2
    const saturationScale = (saturation / 100) + 1;
    saturationChannel.convertTo(saturationChannel, -1, saturationScale, 0);
  } catch (e) {
    console.error('Error applying saturation:', e);
  }
}
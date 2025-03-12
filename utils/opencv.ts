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
  params: AdjustmentParams,
  originalImage: HTMLImageElement | null
): boolean => {
  if (!window.cv) {
    console.error('OpenCV is not loaded');
    return false;
  }

  // Pastikan canvas memiliki dimensi yang valid
  if (inputCanvas.width <= 0 || inputCanvas.height <= 0) {
    console.error('Canvas input memiliki dimensi tidak valid');
    return false;
  }

  try {
    // Gambar ulang gambar asli ke canvas input untuk memastikan data segar
    if (originalImage) {
      const ctx = inputCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
        ctx.drawImage(originalImage, 0, 0, inputCanvas.width, inputCanvas.height);
      }
    }

    // Baca gambar dari input canvas
    const src = window.cv.imread(inputCanvas);

    // Pastikan src valid
    if (!src || src.empty()) {
      console.error('Source image kosong atau tidak valid');
      return false;
    }

    // Create destination matrix
    const dst = new window.cv.Mat();
    src.copyTo(dst);

    // GRAYSCALE - apply first if needed
    if (params.grayscale > 0) {
      try {
        // Convert to grayscale
        const gray = new window.cv.Mat();
        window.cv.cvtColor(dst, gray, window.cv.COLOR_RGBA2GRAY);
        window.cv.cvtColor(gray, gray, window.cv.COLOR_GRAY2RGBA);

        // Blend between original and grayscale based on grayscale parameter
        if (params.grayscale < 100) {
          const alpha = params.grayscale / 100;
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

    // BLUR
    if (params.blur > 0) {
      try {
        const blurSize = Math.max(1, Math.floor(params.blur / 10)) * 2 + 1; // Must be odd number
        const tempMat = new window.cv.Mat();
        window.cv.GaussianBlur(dst, tempMat, new window.cv.Size(blurSize, blurSize), 0);
        tempMat.copyTo(dst);
        tempMat.delete();
      } catch (e) {
        console.error('Error applying blur:', e);
      }
    }

    // INVERT
    if (params.invert) {
      try {
        window.cv.bitwise_not(dst, dst);
      } catch (e) {
        console.error('Error applying invert:', e);
      }
    }

    // SEPIA EFFECT - Fixed implementation with TypeScript compatibility
    if (params.sepia > 0) {
      try {
        // Create temporary matrices for sepia transformation
        const tempRed = new window.cv.Mat();
        const tempGreen = new window.cv.Mat();
        const tempBlue = new window.cv.Mat();

        // Convert to grayscale and back to create separate channels
        const gray = new window.cv.Mat();
        window.cv.cvtColor(dst, gray, window.cv.COLOR_RGBA2GRAY);

        // Create separate channel matrices (R, G, B) with grayscale values
        window.cv.cvtColor(gray, tempRed, window.cv.COLOR_GRAY2RGBA);
        window.cv.cvtColor(gray, tempGreen, window.cv.COLOR_GRAY2RGBA);
        window.cv.cvtColor(gray, tempBlue, window.cv.COLOR_GRAY2RGBA);

        // Apply sepia transformation coefficients using addWeighted
        // Since we can't use push_back for MatVector, we'll process channels manually

        // Apply sepia weights to individual channels one at a time
        const sepiaMat = new window.cv.Mat();
        dst.copyTo(sepiaMat);

        // Create a more subtle sepia effect by applying weighted transformations
        // to the whole image rather than to individual channels
        window.cv.convertScaleAbs(dst, tempRed, 0.393, 0); // Red channel influence
        window.cv.convertScaleAbs(dst, tempGreen, 0.769, 0); // Green channel influence
        window.cv.convertScaleAbs(dst, tempBlue, 0.189, 0); // Blue channel influence

        // Combine the weighted results
        window.cv.addWeighted(tempRed, 0.4, tempGreen, 0.4, 0, sepiaMat);
        window.cv.addWeighted(sepiaMat, 0.8, tempBlue, 0.2, 0, sepiaMat);

        // Blend with original based on sepia parameter
        if (params.sepia < 100) {
          const alpha = params.sepia / 100;
          const beta = 1 - alpha;
          window.cv.addWeighted(sepiaMat, alpha, dst, beta, 0, dst);
        } else {
          sepiaMat.copyTo(dst);
        }

        // Clean up
        tempRed.delete();
        tempGreen.delete();
        tempBlue.delete();
        gray.delete();
        sepiaMat.delete();
      } catch (e) {
        console.error('Error applying sepia effect:', e);
      }
    }

    // Apply brightness and contrast
    try {
      const alpha = (params.contrast / 100) + 1; // Range: 0.0 to 2.0
      const beta = params.brightness; // Range: -100 to 100

      const tempMat = new window.cv.Mat();
      window.cv.convertScaleAbs(dst, tempMat, alpha, beta);
      tempMat.copyTo(dst);
      tempMat.delete();
    } catch (e) {
      console.error('Error applying brightness/contrast:', e);
    }

    // Apply saturation and hue rotation
    if (params.saturation !== 0 || params.hueRotate !== 0) {
      try {
        // Convert to HSV for saturation and hue adjustment
        const hsv = new window.cv.Mat();
        window.cv.cvtColor(dst, hsv, window.cv.COLOR_RGB2HSV);

        // Split channels
        const channels = new window.cv.MatVector();
        window.cv.split(hsv, channels);

        // For debugging
        console.log('Channels size:', channels.size());

        // Make sure we have 3 channels
        if (channels.size() >= 3) {
          // HUE ROTATION (if needed)
          if (params.hueRotate !== 0) {
            try {
              const hueChannel = channels.get(0);
              const hueData = hueChannel.data;

              // Hue values in OpenCV are in range 0-180
              const hueShift = Math.round((params.hueRotate / 360) * 180);

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

          // SATURATION
          if (params.saturation !== 0) {
            try {
              const saturationScale = (params.saturation / 100) + 1; // Range: 0.0 to 2.0
              channels.get(1).convertTo(channels.get(1), -1, saturationScale, 0);
            } catch (e) {
              console.error('Error applying saturation:', e);
            }
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

    try {
      // Show result on output canvas
      window.cv.imshow(outputCanvas, dst);
    } catch (e) {
      console.error('Error displaying result on canvas:', e);

      // Fallback: draw original image to output canvas
      if (originalImage) {
        const outCtx = outputCanvas.getContext('2d');
        if (outCtx) {
          outCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
          outCtx.drawImage(originalImage, 0, 0, outputCanvas.width, outputCanvas.height);
        }
      }

      // Clean up OpenCV objects
      src.delete();
      dst.delete();
      return false;
    }

    // Check if output canvas is empty (all black)
    try {
      const outCtx = outputCanvas.getContext('2d');
      if (outCtx) {
        const imageData = outCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
        const data = imageData.data;

        // Check if all pixels are black
        let allBlack = true;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 0) {
            allBlack = false;
            break;
          }
        }

        if (allBlack) {
          console.warn('Output canvas is all black, using original image as fallback');

          // Draw original image as fallback
          if (originalImage) {
            outCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
            outCtx.drawImage(originalImage, 0, 0, outputCanvas.width, outputCanvas.height);
          }
        }
      }
    } catch (e) {
      console.error('Error checking output canvas:', e);
    }

    // Clean up OpenCV objects
    src.delete();
    dst.delete();

    return true;
  } catch (err) {
    console.error('Error in processImageWithOpenCV:', err);

    // Fallback: draw original image to output canvas
    if (originalImage) {
      const outCtx = outputCanvas.getContext('2d');
      if (outCtx) {
        outCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        outCtx.drawImage(originalImage, 0, 0, outputCanvas.width, outputCanvas.height);
      }
    }

    return false;
  }
};
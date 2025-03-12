// TypeScript interfaces for the image editor components

// Adjustment parameters// Adjustment parameters
export interface AdjustmentParams {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  invert: boolean;
  sepia: number;
  hueRotate: number;
}
export interface OpenCVMat {
  delete: () => void;
  cols: number;
  rows: number;
  channels: () => number;
  empty: () => boolean;
  data: Uint8Array;
  copyTo: (dst: OpenCVMat) => void;
  convertTo: (dst: OpenCVMat, type: number, alpha?: number, beta?: number) => void;
}

export interface OpenCVMatVector {
  delete: () => void;
  get: (index: number) => OpenCVMat;
  size: () => number;
}

export interface OpenCVSize {
  width: number;
  height: number;
}

export interface OpenCV {
  imread: (canvas: HTMLCanvasElement) => OpenCVMat;
  imshow: (canvas: HTMLCanvasElement, mat: OpenCVMat) => void;
  Mat: new () => OpenCVMat;
  MatVector: new () => OpenCVMatVector;
  Size: new (width: number, height: number) => OpenCVSize;
  
  // Color space conversion
  cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
  COLOR_RGB2HSV: number;
  COLOR_HSV2RGB: number;
  COLOR_RGBA2GRAY: number;
  COLOR_GRAY2RGBA: number;
  
  // Brightness and contrast
  convertScaleAbs: (src: OpenCVMat, dst: OpenCVMat, alpha: number, beta: number) => void;
  
  // Channel operations
  split: (src: OpenCVMat, channels: OpenCVMatVector) => void;
  merge: (channels: OpenCVMatVector, dst: OpenCVMat) => void;
  
  // Image transformation
  GaussianBlur: (src: OpenCVMat, dst: OpenCVMat, ksize: OpenCVSize, sigmaX: number, sigmaY?: number, borderType?: number) => void;
  bitwise_not: (src: OpenCVMat, dst: OpenCVMat) => void;
  addWeighted: (src1: OpenCVMat, alpha: number, src2: OpenCVMat, beta: number, gamma: number, dst: OpenCVMat) => void;
  transform: (src: OpenCVMat, dst: OpenCVMat, m: OpenCVMat) => void;
  
  // Matrix creation
  matFromArray: (rows: number, cols: number, type: number, array: number[]) => OpenCVMat;
  
  // Constants
  CV_8U: number;
  CV_8UC3: number;
  CV_32F: number;
  CV_32FC3: number;
  CV_64F: number;
  
  // Border types
  BORDER_DEFAULT: number;
  BORDER_CONSTANT: number;
  BORDER_REFLECT: number;
  BORDER_REPLICATE: number;
}

// Extend Window interface to include OpenCV
declare global {
  interface Window {
    cv: OpenCV;
  }
}

// Props for the components
export interface AdjustmentSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  onChange: (value: number) => void;
  leftLabel: string;
  middleLabel: string;
  rightLabel: string;
}

export interface ImageAdjustmentsProps {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: number;
  invert: boolean;
  sepia: number;
  hueRotate: number;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setBlur: (value: number) => void;
  setGrayscale: (value: number) => void;
  setInvert: (value: boolean) => void;
  setSepia: (value: number) => void;
  setHueRotate: (value: number) => void;
  handleReset: () => void;
  imageLoaded: boolean;
}

export interface ImageUploadProps {
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ImagePreviewProps {
  imageLoaded: boolean;
  processing: boolean;
  outputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleDownload: () => void;
  originalImage: HTMLImageElement | null; // Added originalImage property
}


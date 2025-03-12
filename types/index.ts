// TypeScript interfaces for the image editor components

// Adjustment parameters
export interface AdjustmentParams {
  brightness: number;
  contrast: number;
  saturation: number;
}

// OpenCV specific types
export interface OpenCVMat {
  delete: () => void;
  cols: number;
  rows: number;
  channels: () => number;
  empty: () => boolean;
  convertTo: (dst: OpenCVMat, type: number, alpha: number, beta: number) => void;
}

export interface OpenCVMatVector {
  delete: () => void;
  get: (index: number) => OpenCVMat;
  size: () => number;
}

export interface OpenCV {
  imread: (canvas: HTMLCanvasElement) => OpenCVMat;
  imshow: (canvas: HTMLCanvasElement, mat: OpenCVMat) => void;
  Mat: new () => OpenCVMat;
  MatVector: new () => OpenCVMatVector;
  cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
  convertScaleAbs: (src: OpenCVMat, dst: OpenCVMat, alpha: number, beta: number) => void;
  split: (src: OpenCVMat, channels: OpenCVMatVector) => void;
  merge: (channels: OpenCVMatVector, dst: OpenCVMat) => void;
  COLOR_RGB2HSV: number;
  COLOR_HSV2RGB: number;
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
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
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
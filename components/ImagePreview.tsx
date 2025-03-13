'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, ImageIcon } from 'lucide-react';

// Update interface to include iOS flag
interface ImprovedImagePreviewProps {
  imageLoaded: boolean;
  processing: boolean;
  outputCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  handleDownload: () => void;
  originalImage: HTMLImageElement | null;
  canvasWidth?: number;
  canvasHeight?: number;
  isIOS?: boolean;
}

const ImagePreview: React.FC<ImprovedImagePreviewProps> = ({
  imageLoaded,
  processing,
  outputCanvasRef,
  handleDownload,
  // originalImage,
  canvasWidth = 0,
  canvasHeight = 0,
  isIOS = false
}) => {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Preview Results</CardTitle>
        <CardDescription>
          {imageLoaded ? 'See adjustment results in real-time' : 'Upload an image to start editing'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
          {!imageLoaded ? (
            <div className="text-center p-6">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No image uploaded yet
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Canvas with explicit dimensions - iOS optimized */}
              <canvas 
                ref={outputCanvasRef} 
                width={canvasWidth}
                height={canvasHeight}
                className="border border-gray-200 dark:border-gray-700" 
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  margin: '0 auto'
                }}
              />
              
              {/* Loading overlay only shown during upload */}
              {processing && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="h-8 w-8 border-4 border-t-blue-500 border-r-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Download button below preview */}
        {imageLoaded && (
          <div className="mt-4">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleDownload}
              disabled={processing}
            >
              <Download className="h-4 w-4 mr-2" /> {isIOS ? 'View Result' : 'Download Result'}
            </Button>
          </div>
        )}
        
        {/* iOS specific help text */}
        {isIOS && imageLoaded && (
          <p className="mt-2 text-xs text-center text-gray-500">
            On iOS devices, the image will open in a new tab
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ImagePreview;
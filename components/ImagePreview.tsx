'use client'

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, ImageIcon } from 'lucide-react';
import { ImagePreviewProps } from '../types';

const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageLoaded,
  processing, // Now only true during upload, not adjustments
  outputCanvasRef,
  handleDownload,
  originalImage
}) => {
  // Fallback to show original image if canvas fails
  useEffect(() => {
    if (imageLoaded && outputCanvasRef.current && originalImage) {
      const ctx = outputCanvasRef.current.getContext('2d');
      if (ctx) {
        // Check if canvas is empty (all black pixels)
        try {
          const imageData = ctx.getImageData(0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
          const data = imageData.data;
          
          // Check if canvas is mostly black (empty)
          let blackPixels = 0;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 0 && data[i+1] === 0 && data[i+2] === 0) {
              blackPixels++;
            }
          }
          
          // If more than 90% of pixels are black, redraw original image
          if (blackPixels > (data.length / 4) * 0.9) {
            console.log('Canvas appears empty, redrawing with original image');
            ctx.drawImage(originalImage, 0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
          }
        } catch (e) {
          console.log('Error checking canvas, falling back to original image', e);
          ctx.drawImage(originalImage, 0, 0, outputCanvasRef.current.width, outputCanvasRef.current.height);
        }
      }
    }
  }, [imageLoaded, outputCanvasRef, originalImage]);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Preview Hasil</CardTitle>
        <CardDescription>
          {imageLoaded ? 'Lihat hasil penyesuaian secara langsung' : 'Unggah gambar untuk mulai mengedit'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
          {!imageLoaded ? (
            <div className="text-center p-6">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Belum ada gambar yang diunggah
              </p>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <canvas 
                ref={outputCanvasRef} 
                className="max-w-full max-h-[400px] object-contain border border-gray-200 dark:border-gray-700" 
                style={{display: 'block'}}
              />
              
              {/* Loading overlay only shown during initial upload */}
              {processing && (
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                  <div className="h-8 w-8 border-4 border-t-blue-500 border-r-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Fallback image if canvas is empty */}
              {imageLoaded && originalImage && (
                <img 
                  src={originalImage.src} 
                  alt="Original" 
                  style={{
                    display: 'none', // Initially hidden, used as fallback
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}
                  onError={(e) => {
                    console.log('Error loading fallback image');
                  }}
                />
              )}
            </div>
          )}
        </div>
        
        {/* Tombol Unduh di bawah preview */}
        {imageLoaded && (
          <div className="mt-4">
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleDownload}
              disabled={processing} // Only disabled during upload
            >
              <Download className="h-4 w-4 mr-2" /> Unduh Hasil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImagePreview;
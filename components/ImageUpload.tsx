'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';
import { ImageUploadProps } from '../types';

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  // Unique ID untuk input file untuk mencegah konflik jika ada multiple instances
  const fileInputId = React.useId() + "-file-input";
  
  return (
    <Card className="shadow-md overflow-hidden p-0">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-5 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Upload Gambar</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Format yang didukung: JPG, PNG, WebP</p>
      </div>
      
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div 
            className="w-full h-24 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-blue-300 dark:border-blue-500 rounded-xl cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => document.getElementById(fileInputId)?.click()}
          >
            <ImageIcon className="h-8 w-8 text-blue-400 dark:text-blue-300 mb-2" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Klik untuk memilih gambar
            </span>
          </div>
          <input 
            id={fileInputId} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={onImageUpload}
          />
          
          <div className="flex justify-between gap-4">
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => document.getElementById(fileInputId)?.click()}
            >
              <ImageIcon className="h-4 w-4 mr-2" /> Upload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
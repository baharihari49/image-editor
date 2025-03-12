'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import AdjustmentSlider from './AdjustmentSlider';
import { ImageAdjustmentsProps } from '../types';

const ImageAdjustments: React.FC<ImageAdjustmentsProps> = ({
  brightness,
  contrast,
  saturation,
  setBrightness,
  setContrast,
  setSaturation,
  handleReset,
  imageLoaded
}) => {
  return (
    <Card className="shadow-md h-fit">
      <CardHeader>
        <CardTitle>Pengaturan Gambar</CardTitle>
        <CardDescription>
          Sesuaikan parameter untuk mengubah gambar Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <AdjustmentSlider
          label="Brightness"
          value={brightness}
          min={-100}
          max={100}
          step={1}
          disabled={!imageLoaded}
          onChange={setBrightness}
          leftLabel="Gelap"
          middleLabel="Normal"
          rightLabel="Terang"
        />
        
        <AdjustmentSlider
          label="Contrast"
          value={contrast}
          min={-100}
          max={100}
          step={1}
          disabled={!imageLoaded}
          onChange={setContrast}
          leftLabel="Rendah"
          middleLabel="Normal"
          rightLabel="Tinggi"
        />
        
        <AdjustmentSlider
          label="Saturation"
          value={saturation}
          min={-100}
          max={100}
          step={1}
          disabled={!imageLoaded}
          onChange={setSaturation}
          leftLabel="Abu-abu"
          middleLabel="Normal"
          rightLabel="Vivid"
        />
        
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleReset}
            disabled={!imageLoaded}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset Semua Pengaturan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageAdjustments;
'use client'

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AdjustmentSlider from './AdjustmentSlider';
import { ImageAdjustmentsProps } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ImageAdjustments: React.FC<ImageAdjustmentsProps> = ({
  brightness,
  contrast,
  saturation,
  blur,
  grayscale,
  invert,
  sepia,
  hueRotate,
  setBrightness,
  setContrast,
  setSaturation,
  setBlur,
  setGrayscale,
  setInvert,
  setSepia,
  setHueRotate,
  handleReset,
  imageLoaded
}) => {
  return (
    <Card className="shadow-md h-fit">
      <CardHeader>
        <CardTitle>Image Settings</CardTitle>
        <CardDescription>
          Adjust parameters to modify your image
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="mb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <AdjustmentSlider
              label="Brightness"
              value={brightness}
              min={-100}
              max={100}
              step={1}
              disabled={!imageLoaded}
              onChange={setBrightness}
              leftLabel="Dark"
              middleLabel="Normal"
              rightLabel="Bright"
            />
            
            <AdjustmentSlider
              label="Contrast"
              value={contrast}
              min={-100}
              max={100}
              step={1}
              disabled={!imageLoaded}
              onChange={setContrast}
              leftLabel="Low"
              middleLabel="Normal"
              rightLabel="High"
            />
            
            <AdjustmentSlider
              label="Saturation"
              value={saturation}
              min={-100}
              max={100}
              step={1}
              disabled={!imageLoaded}
              onChange={setSaturation}
              leftLabel="Gray"
              middleLabel="Normal"
              rightLabel="Vivid"
            />
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <AdjustmentSlider
              label="Blur"
              value={blur}
              min={0}
              max={100}
              step={1}
              disabled={!imageLoaded}
              onChange={setBlur}
              leftLabel="None"
              middleLabel="Medium"
              rightLabel="Strong"
            />
            
            <AdjustmentSlider
              label="Grayscale"
              value={grayscale}
              min={0}
              max={100}
              step={1}
              disabled={!imageLoaded}
              onChange={setGrayscale}
              leftLabel="Off"
              middleLabel="50%"
              rightLabel="Full"
            />
            
            <AdjustmentSlider
              label="Sepia"
              value={sepia}
              min={0}
              max={100}
              step={1}
              disabled={!imageLoaded}
              onChange={setSepia}
              leftLabel="Off"
              middleLabel="50%"
              rightLabel="Full"
            />
            
            <AdjustmentSlider
              label="Hue Rotate"
              value={hueRotate}
              min={-180}
              max={180}
              step={1}
              disabled={!imageLoaded}
              onChange={setHueRotate}
              leftLabel="-180°"
              middleLabel="0°"
              rightLabel="180°"
            />
            
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="invert-toggle" className="font-medium">Invert Colors</Label>
              <Switch 
                id="invert-toggle"
                checked={invert}
                onCheckedChange={setInvert}
                disabled={!imageLoaded}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleReset}
            disabled={!imageLoaded}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset All Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageAdjustments;
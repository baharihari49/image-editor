'use client'

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { AdjustmentSliderProps } from '../types';

const AdjustmentSlider: React.FC<AdjustmentSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  disabled,
  onChange,
  leftLabel,
  middleLabel,
  rightLabel
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label htmlFor={label.toLowerCase()} className="text-base">{label}</Label>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
          {value}
        </span>
      </div>
      <Slider
        id={label.toLowerCase()}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        disabled={disabled}
        className="py-2"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{leftLabel}</span>
        <span>{middleLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
};

export default AdjustmentSlider;
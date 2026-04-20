import React, { useState, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  RotateCw, 
  ZoomIn, 
  RotateCcw,
  LayoutTemplate
} from 'lucide-react';

const ASPECT_RATIOS = [
  { label: '1:1', value: 1 / 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Livre', value: null },
];

const ImageEditor = ({ 
  imageSrc, 
  onCropComplete, 
  initialAspect = 1,
  exposedRotation,
  onExposedRotationChange
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [internalRotation, setInternalRotation] = useState(0);
  
  const rotation = exposedRotation !== undefined ? exposedRotation : internalRotation;
  const [aspect, setAspect] = useState(initialAspect);

  const handleRotationChange = (newRotation) => {
    if (onExposedRotationChange) {
      onExposedRotationChange(newRotation);
    } else {
      setInternalRotation(newRotation);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Editor Area */}
      <div className="relative w-full h-[165px] bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-inner select-none touch-none shrink-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          onRotationChange={handleRotationChange}
          classes={{
            containerClassName: "bg-slate-900",
            cropAreaClassName: "border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
          }}
          showGrid={false}
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-y-2 p-2.5 bg-muted/30 rounded-lg border shrink-0 text-[10px]">
        
        {/* Zoom Control */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <ZoomIn className="w-3 h-3" /> Zoom
            </Label>
            <span className="text-[10px] font-mono">{zoom.toFixed(1)}x</span>
          </div>
          <input 
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary block mt-0.5"
          />
        </div>

        {/* Rotation Control */}
        <div className="space-y-0.5">
          <div className="flex justify-between items-center">
            <Label className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <RotateCw className="w-3 h-3" /> Rotação
            </Label>
            <span className="text-[10px] font-mono">{rotation}°</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-5 w-5 shrink-0"
              onClick={() => handleRotationChange(Math.max(rotation - 90, 0))}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <input 
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => handleRotationChange(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-primary block"
            />
             <Button 
              variant="outline" 
              size="icon" 
              className="h-5 w-5 shrink-0"
              onClick={() => handleRotationChange(Math.min(rotation + 90, 360))}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Aspect Ratio Presets */}
        <div className="space-y-0.5">
           <Label className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <LayoutTemplate className="w-3 h-3" /> Proporção
            </Label>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {ASPECT_RATIOS.map((ratio) => (
                <Button
                  key={ratio.label}
                  variant={aspect === ratio.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAspect(ratio.value)}
                  className="flex-1 min-w-[33px] h-6 text-xs px-1"
                >
                  {ratio.label}
                </Button>
              ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Download, RotateCcw } from 'lucide-react';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, onEnhancedImage }: ImageEnhancerProps) => {
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturation, setSaturation] = useState([100]);
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');

  const applyEnhancements = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (ctx) {
        // Apply filters
        ctx.filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturation[0]}%)`;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setEnhancedUrl(url);
            onEnhancedImage?.(url);
          }
        }, 'image/png');
      }
    };
    
    img.src = imageUrl;
  };

  const resetEnhancements = () => {
    setBrightness([100]);
    setContrast([100]);
    setSaturation([100]);
    setEnhancedUrl('');
  };

  const downloadEnhanced = () => {
    const link = document.createElement('a');
    link.href = enhancedUrl;
    link.download = `enhanced-${imageName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Image Enhancer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <img 
              src={imageUrl} 
              alt="Original" 
              className="w-full h-20 object-contain border rounded"
            />
            <p className="text-xs text-center text-gray-600">Original</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 border rounded bg-gray-50 flex items-center justify-center">
              {enhancedUrl ? (
                <img 
                  src={enhancedUrl} 
                  alt="Enhanced" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="text-xs text-gray-400">Enhanced preview</p>
              )}
            </div>
            <p className="text-xs text-center text-gray-600">Enhanced</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Brightness: {brightness[0]}%</Label>
            <Slider
              value={brightness}
              onValueChange={setBrightness}
              max={200}
              min={50}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Contrast: {contrast[0]}%</Label>
            <Slider
              value={contrast}
              onValueChange={setContrast}
              max={200}
              min={50}
              step={5}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Saturation: {saturation[0]}%</Label>
            <Slider
              value={saturation}
              onValueChange={setSaturation}
              max={200}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={applyEnhancements}
            size="sm"
            className="flex-1"
          >
            Apply
          </Button>
          <Button 
            onClick={resetEnhancements}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>

        {enhancedUrl && (
          <Button 
            onClick={downloadEnhanced}
            size="sm"
            className="w-full"
          >
            <Download className="h-3 w-3 mr-1" />
            Download Enhanced
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

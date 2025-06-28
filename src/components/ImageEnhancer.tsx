
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Sparkles, ShoppingBag } from 'lucide-react';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, onEnhancedImage }: ImageEnhancerProps) => {
  const [backgroundType, setBackgroundType] = useState('white');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const backgroundOptions = [
    { value: 'white', label: 'Pure White', color: '#FFFFFF' },
    { value: 'transparent', label: 'Transparent', color: 'transparent' },
    { value: 'light-gray', label: 'Light Gray', color: '#F5F5F5' },
    { value: 'gradient-light', label: 'Light Gradient', color: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
    { value: 'gradient-warm', label: 'Warm Gradient', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  ];

  const sizeOptions = [
    { value: '512x512', label: '512×512 (Small)' },
    { value: '1024x1024', label: '1024×1024 (Medium)' },
    { value: '2048x2048', label: '2048×2048 (Large)' },
    { value: '1080x1080', label: '1080×1080 (Instagram)' },
    { value: '1200x1200', label: '1200×1200 (Shopify)' },
  ];

  const applyProfessionalEnhancements = async () => {
    setIsProcessing(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const [width, height] = imageSize.split('x').map(Number);
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          // Set background
          if (backgroundType === 'transparent') {
            ctx.clearRect(0, 0, width, height);
          } else if (backgroundType === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'light-gray') {
            ctx.fillStyle = '#F5F5F5';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'gradient-light') {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#f5f7fa');
            gradient.addColorStop(1, '#c3cfe2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'gradient-warm') {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#ffecd2');
            gradient.addColorStop(1, '#fcb69f');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          }
          
          // Calculate scaling to fit image while maintaining aspect ratio
          const scale = Math.min(width / img.width, height / img.height) * 0.8; // 80% of canvas for padding
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the image
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          // Apply subtle shadow for depth (except for transparent background)
          if (backgroundType !== 'transparent') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 10;
          }
          
          // Draw the image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setEnhancedUrl(url);
              onEnhancedImage?.(url);
            }
            setIsProcessing(false);
          }, backgroundType === 'transparent' ? 'image/png' : 'image/jpeg', 0.95);
        }
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    } catch (error) {
      console.error('Enhancement failed:', error);
      setIsProcessing(false);
    }
  };

  const downloadEnhanced = () => {
    const link = document.createElement('a');
    link.href = enhancedUrl;
    link.download = `professional-${imageName.replace(/\s+/g, '-').toLowerCase()}-${imageSize}.${backgroundType === 'transparent' ? 'png' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetEnhancements = () => {
    setBackgroundType('white');
    setImageSize('1024x1024');
    setEnhancedUrl('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Professional E-commerce Enhancement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <img 
              src={imageUrl} 
              alt="Original" 
              className="w-full h-20 object-contain border rounded"
            />
            <p className="text-xs text-center text-gray-600">Original Crop</p>
          </div>
          <div className="space-y-2">
            <div className="w-full h-20 border rounded bg-gray-50 flex items-center justify-center">
              {enhancedUrl ? (
                <img 
                  src={enhancedUrl} 
                  alt="Professional" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <ShoppingBag className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-400">Professional</p>
                </div>
              )}
            </div>
            <p className="text-xs text-center text-gray-600">E-commerce Ready</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Background Style</Label>
            <Select value={backgroundType} onValueChange={setBackgroundType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {backgroundOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border"
                        style={{ background: option.color }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Image Size</Label>
            <Select value={imageSize} onValueChange={setImageSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={applyProfessionalEnhancements}
            size="sm"
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-3 w-3 mr-1 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Enhance for Sale
              </>
            )}
          </Button>
          <Button 
            onClick={resetEnhancements}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>
        </div>

        {enhancedUrl && (
          <div className="space-y-2">
            <Button 
              onClick={downloadEnhanced}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="h-3 w-3 mr-1" />
              Download Professional Image
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Ready for Shopify, Etsy, or other e-commerce platforms
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

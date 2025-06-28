
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ShoppingBag, Package } from 'lucide-react';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, onEnhancedImage }: ImageEnhancerProps) => {
  const [backgroundType, setBackgroundType] = useState('white');
  const [imageSize, setImageSize] = useState('2048x2048');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Shopify-optimized background options
  const backgroundOptions = [
    { value: 'white', label: 'Pure White (Recommended)', color: '#FFFFFF' },
    { value: 'transparent', label: 'Transparent PNG', color: 'transparent' },
    { value: 'light-neutral', label: 'Light Neutral', color: '#F8F9FA' },
    { value: 'clean-gradient', label: 'Clean Gradient', color: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)' },
  ];

  // Shopify-optimized image sizes
  const sizeOptions = [
    { value: '2048x2048', label: '2048×2048 (Shopify High-Res)', recommended: true },
    { value: '1024x1024', label: '1024×1024 (Shopify Standard)' },
    { value: '800x800', label: '800×800 (Shopify Mobile)' },
    { value: '2000x2000', label: '2000×2000 (Shopify Plus)' },
  ];

  const enhanceForShopify = async () => {
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
          // Set Shopify-optimized background
          if (backgroundType === 'transparent') {
            ctx.clearRect(0, 0, width, height);
          } else if (backgroundType === 'white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'light-neutral') {
            ctx.fillStyle = '#F8F9FA';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'clean-gradient') {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#f8f9fa');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          }
          
          // Calculate optimal product placement (75% of canvas for better product visibility)
          const scale = Math.min(width / img.width, height / img.height) * 0.75;
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the product image
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          // Add subtle professional shadow (except for transparent)
          if (backgroundType !== 'transparent') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;
          }
          
          // Draw the product image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Convert to Shopify-optimized format
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
      console.error('Shopify optimization failed:', error);
      setIsProcessing(false);
    }
  };

  const downloadShopifyImage = () => {
    const link = document.createElement('a');
    link.href = enhancedUrl;
    const fileExtension = backgroundType === 'transparent' ? 'png' : 'jpg';
    link.download = `shopify-${imageName.replace(/\s+/g, '-').toLowerCase()}-${imageSize}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetSettings = () => {
    setBackgroundType('white');
    setImageSize('2048x2048');
    setEnhancedUrl('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Package className="h-4 w-4" />
          Shopify Product Optimizer
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
                  alt="Shopify Ready" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <ShoppingBag className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-400">Shopify Ready</p>
                </div>
              )}
            </div>
            <p className="text-xs text-center text-gray-600">Optimized for Shopify</p>
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
            <Label className="text-xs">Shopify Image Size</Label>
            <Select value={imageSize} onValueChange={setImageSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={enhanceForShopify}
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Package className="h-3 w-3 mr-1 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Package className="h-3 w-3 mr-1" />
                Optimize for Shopify
              </>
            )}
          </Button>
          <Button 
            onClick={resetSettings}
            variant="outline"
            size="sm"
          >
            Reset
          </Button>
        </div>

        {enhancedUrl && (
          <div className="space-y-2">
            <Button 
              onClick={downloadShopifyImage}
              size="sm"
              className="w-full bg-shopify-green hover:bg-shopify-green-dark"
              style={{ backgroundColor: '#5C6AC4', color: 'white' }}
            >
              <Download className="h-3 w-3 mr-1" />
              Download Shopify Product Image
            </Button>
            <div className="text-xs text-gray-500 space-y-1">
              <p className="text-center font-medium">✅ Shopify Ready Features:</p>
              <ul className="text-left space-y-1 pl-4">
                <li>• High-resolution for zoom functionality</li>
                <li>• Professional background for clean listings</li>
                <li>• Optimized file size for fast loading</li>
                <li>• Square format for consistent display</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

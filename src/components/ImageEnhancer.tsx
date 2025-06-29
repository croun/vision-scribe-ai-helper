import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, ShoppingBag, Package, Sparkles, Wand } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, onEnhancedImage }: ImageEnhancerProps) => {
  const [backgroundType, setBackgroundType] = useState('professional-white');
  const [imageSize, setImageSize] = useState('2048x2048');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Professional Shopify background options
  const backgroundOptions = [
    { value: 'professional-white', label: 'Professional Pure White', color: '#FFFFFF', description: 'Clean, bright white background' },
    { value: 'soft-white', label: 'Soft White with Shadow', color: '#FEFEFE', description: 'White with subtle product shadow' },
    { value: 'transparent', label: 'Transparent PNG', color: 'transparent', description: 'No background (PNG format)' },
    { value: 'light-gray', label: 'Light Gray Studio', color: '#F5F5F5', description: 'Professional studio lighting' },
    { value: 'gradient-white', label: 'Premium White Gradient', color: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', description: 'Subtle gradient effect' },
  ];

  // Shopify-optimized image sizes
  const sizeOptions = [
    { value: '2048x2048', label: '2048×2048 - Shopify High-Res', recommended: true, description: 'Best for zoom & detail' },
    { value: '1024x1024', label: '1024×1024 - Shopify Standard', description: 'Perfect balance of quality & size' },
    { value: '800x800', label: '800×800 - Mobile Optimized', description: 'Fast loading for mobile' },
    { value: '2000x2000', label: '2000×2000 - Shopify Plus', description: 'Premium quality for Pro stores' },
  ];

  const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const enhanceWithOpenAI = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key');
      return;
    }

    setIsEnhancing(true);
    
    try {
      // Use DALL-E 3 for image editing instead of GPT-4 vision
      const base64Image = await convertImageToBase64(imageUrl);
      
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          prompt: "Enhance this image to match the style of a Shopify product photo. Make the product the visual focus with a clean white background, improve brightness and contrast to simulate studio lighting, sharpen the product edges for clarity, enhance color accuracy and saturation, maintain a natural look with soft shadows if applicable, and ensure the image looks polished and ready for an e-commerce storefront.",
          n: 1,
          size: "1024x1024"
        }),
      });

      if (!response.ok) {
        // If DALL-E edit fails, try with the regular canvas enhancement
        console.log('DALL-E edit not available, using canvas enhancement');
        await enhanceForShopify();
        return;
      }

      const data = await response.json();
      const enhancedImageUrl = data.data[0]?.url;
      
      if (enhancedImageUrl) {
        setEnhancedUrl(enhancedImageUrl);
        onEnhancedImage?.(enhancedImageUrl);
        toast.success('Image enhanced successfully with AI! Professional Shopify-ready image created.');
      } else {
        throw new Error('No enhanced image received from OpenAI');
      }

    } catch (error) {
      console.error('OpenAI enhancement error:', error);
      toast.error('AI enhancement not available. Using advanced canvas enhancement instead.');
      // Fallback to canvas enhancement
      await enhanceForShopify();
    } finally {
      setIsEnhancing(false);
    }
  };

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
          // Professional background setup
          if (backgroundType === 'transparent') {
            ctx.clearRect(0, 0, width, height);
          } else if (backgroundType === 'professional-white') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'soft-white') {
            ctx.fillStyle = '#FEFEFE';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'light-gray') {
            ctx.fillStyle = '#F5F5F5';
            ctx.fillRect(0, 0, width, height);
          } else if (backgroundType === 'gradient-white') {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#f8f9fa');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
          }
          
          // Professional product sizing (85% for better visual impact)
          const scale = Math.min(width / img.width, height / img.height) * 0.85;
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the product perfectly
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          // Professional shadow effect (except for transparent)
          if (backgroundType !== 'transparent') {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 15;
          }
          
          // Draw the enhanced product image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Advanced image enhancement
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Enhanced brightness and contrast for professional look
            const brightness = 1.15;
            const contrast = 1.2;
            
            // Apply brightness
            data[i] = Math.min(255, data[i] * brightness);     // Red
            data[i + 1] = Math.min(255, data[i + 1] * brightness); // Green  
            data[i + 2] = Math.min(255, data[i + 2] * brightness); // Blue
            
            // Apply contrast
            data[i] = Math.min(255, ((data[i] - 128) * contrast) + 128);
            data[i + 1] = Math.min(255, ((data[i + 1] - 128) * contrast) + 128);
            data[i + 2] = Math.min(255, ((data[i + 2] - 128) * contrast) + 128);
            
            // Enhance saturation slightly
            const max = Math.max(data[i], data[i + 1], data[i + 2]);
            const min = Math.min(data[i], data[i + 1], data[i + 2]);
            if (max !== min) {
              const saturationBoost = 1.1;
              const delta = (max - min) * saturationBoost;
              const adjustment = (delta - (max - min)) / 2;
              
              if (data[i] !== max && data[i] !== min) data[i] = Math.max(0, Math.min(255, data[i] - adjustment));
              if (data[i + 1] !== max && data[i + 1] !== min) data[i + 1] = Math.max(0, Math.min(255, data[i + 1] - adjustment));
              if (data[i + 2] !== max && data[i + 2] !== min) data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - adjustment));
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          // Apply subtle sharpening filter
          const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
          const sharpenedData = ctx.getImageData(0, 0, width, height);
          const originalData = imageData.data;
          const newData = sharpenedData.data;
          
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                  for (let kx = -1; kx <= 1; kx++) {
                    const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
                    sum += originalData[pixel] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
                  }
                }
                const pixel = (y * width + x) * 4 + c;
                newData[pixel] = Math.max(0, Math.min(255, sum));
              }
            }
          }
          
          ctx.putImageData(sharpenedData, 0, 0);
          
          // Convert to optimized format
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setEnhancedUrl(url);
              onEnhancedImage?.(url);
              toast.success('Professional Shopify image enhancement complete!');
            }
            setIsProcessing(false);
          }, backgroundType === 'transparent' ? 'image/png' : 'image/jpeg', 0.95);
        }
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    } catch (error) {
      console.error('Professional enhancement failed:', error);
      toast.error('Enhancement failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const downloadShopifyImage = () => {
    const link = document.createElement('a');
    link.href = enhancedUrl;
    const fileExtension = backgroundType === 'transparent' ? 'png' : 'jpg';
    link.download = `shopify-ready-${imageName.replace(/\s+/g, '-').toLowerCase()}-${imageSize}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetSettings = () => {
    setBackgroundType('professional-white');
    setImageSize('2048x2048');
    setEnhancedUrl('');
  };

  return (
    <Card className="w-full border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <Sparkles className="h-5 w-5" />
          AI-Powered Shopify Enhancement
        </CardTitle>
        <p className="text-sm text-blue-600">Transform your cropped image into a professional Shopify product photo</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* OpenAI API Key Input */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <Wand className="h-4 w-4" />
              AI Image Enhancement (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="text-sm">OpenAI API Key (for AI enhancement)</Label>
              <input
                id="openai-key"
                type="password"
                placeholder="sk-... (optional)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-orange-200 rounded-md text-sm font-mono"
              />
            </div>
            <Button 
              onClick={enhanceWithOpenAI}
              disabled={!apiKey.trim() || isEnhancing}
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isEnhancing ? (
                <>
                  <Wand className="h-3 w-3 mr-2 animate-pulse" />
                  Enhancing with AI...
                </>
              ) : (
                <>
                  <Wand className="h-3 w-3 mr-2" />
                  Try AI Enhancement
                </>
              )}
            </Button>
            <p className="text-xs text-orange-600">
              If AI enhancement isn't available, the advanced canvas enhancement below will be used automatically.
            </p>
          </CardContent>
        </Card>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="relative">
              <img 
                src={imageUrl} 
                alt="Original" 
                className="w-full h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50"
              />
              <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 text-xs rounded font-medium">
                BEFORE
              </div>
            </div>
            <p className="text-sm text-center text-gray-600 font-medium">Original Cropped Image</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <div className="w-full h-32 border-2 border-green-200 rounded-lg bg-white flex items-center justify-center">
                {enhancedUrl ? (
                  <>
                    <img 
                      src={enhancedUrl} 
                      alt="Shopify Ready" 
                      className="w-full h-full object-contain rounded-lg"
                    />
                    <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs rounded font-medium">
                      AFTER
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <ShoppingBag className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-green-600 font-medium">Professional Result</p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-center text-green-600 font-medium">Shopify-Ready Product</p>
          </div>
        </div>

        {/* Enhancement Settings */}
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Professional Background</Label>
            <Select value={backgroundType} onValueChange={setBackgroundType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {backgroundOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ background: option.color }}
                      />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Shopify Image Size</Label>
            <Select value={imageSize} onValueChange={setImageSize}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                      {option.recommended && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          BEST
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={enhanceForShopify}
            size="lg"
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Enhancing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Create Professional Image
              </>
            )}
          </Button>
          <Button 
            onClick={resetSettings}
            variant="outline"
            size="lg"
            className="px-6"
          >
            Reset
          </Button>
        </div>

        {/* Download Section */}
        {enhancedUrl && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 text-green-700">
              <Package className="h-5 w-5" />
              <span className="font-semibold">Professional Enhancement Complete!</span>
            </div>
            
            <Button 
              onClick={downloadShopifyImage}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Shopify-Ready Image
            </Button>
            
            <div className="text-sm text-green-700 space-y-2">
              <p className="font-semibold">✅ Professional Features Applied:</p>
              <ul className="space-y-1 pl-4">
                <li>• Pure white background perfect for Shopify</li>
                <li>• Enhanced brightness and contrast for appeal</li>
                <li>• Sharpened edges for crystal clear detail</li>
                <li>• Improved color saturation and accuracy</li>
                <li>• Professional shadows and lighting effects</li>
                <li>• Perfect square format for consistent display</li>
                <li>• Optimized file size for fast loading</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

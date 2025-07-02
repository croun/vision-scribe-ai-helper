
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Download, RefreshCw, Palette, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancementSettings } from './ImageEnhancer/EnhancementSettings';
import { enhanceImageWithCanvas } from './ImageEnhancer/imageUtils';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  detectionResult?: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, detectionResult, onEnhancedImage }: ImageEnhancerProps) => {
  const [backgroundType, setBackgroundType] = useState('studio-white');
  const [imageSize, setImageSize] = useState('2048x2048');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Professional backgrounds inspired by Prodoshot
  const backgroundOptions = [
    { 
      value: 'studio-white', 
      label: 'Studio White', 
      color: '#FFFFFF', 
      description: 'Pure white professional background' 
    },
    { 
      value: 'soft-studio', 
      label: 'Soft Studio', 
      color: '#FAFAFA', 
      description: 'Soft white with subtle warmth' 
    },
    { 
      value: 'premium-gradient', 
      label: 'Premium Gradient', 
      color: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)', 
      description: 'Elegant gradient background' 
    },
    { 
      value: 'light-neutral', 
      label: 'Light Neutral', 
      color: '#F5F5F5', 
      description: 'Professional neutral tone' 
    },
    { 
      value: 'transparent', 
      label: 'Transparent PNG', 
      color: 'transparent', 
      description: 'No background, transparent PNG' 
    },
  ];

  // Shopify-optimized sizes
  const sizeOptions = [
    { 
      value: '2048x2048', 
      label: '2048×2048 - Premium', 
      recommended: true, 
      description: 'Best quality with zoom support' 
    },
    { 
      value: '1024x1024', 
      label: '1024×1024 - Standard', 
      description: 'Perfect balance of quality & performance' 
    },
    { 
      value: '2000x2000', 
      label: '2000×2000 - High-End', 
      description: 'Premium store quality' 
    },
    { 
      value: '800x800', 
      label: '800×800 - Mobile', 
      description: 'Optimized for mobile commerce' 
    },
  ];

  const enhanceForShopify = async () => {
    setIsProcessing(true);
    
    try {
      console.log(`Creating professional product image with ${backgroundType} background at ${imageSize}`);
      const url = await enhanceImageWithCanvas(imageUrl, backgroundType, imageSize);
      setEnhancedUrl(url);
      onEnhancedImage?.(url);
      toast.success('Professional product image created successfully!');
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.error('Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!enhancedUrl) return;
    
    const link = document.createElement('a');
    link.href = enhancedUrl;
    const fileExtension = backgroundType === 'transparent' ? 'png' : 'jpg';
    const cleanName = imageName.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    link.download = `shopify-${cleanName}-${imageSize.replace('x', 'x')}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded: shopify-${cleanName}-${imageSize.replace('x', 'x')}.${fileExtension}`);
  };

  const resetSettings = () => {
    setBackgroundType('studio-white');
    setImageSize('2048x2048');
    setEnhancedUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Main Enhancement Card */}
      <Card className="border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/30">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
          <CardTitle className="text-xl flex items-center gap-2 text-purple-800">
            <Palette className="h-6 w-6" />
            Professional Product Enhancement
          </CardTitle>
          <p className="text-sm text-purple-600">Transform your product images into Shopify-ready professional shots</p>
        </CardHeader>
        <CardContent className="p-6">
          {/* Image Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Original" 
                  className="w-full h-48 object-contain border-2 border-gray-200 rounded-lg bg-gray-50/50"
                />
                <div className="absolute top-2 left-2 bg-gray-800 text-white px-3 py-1 text-xs rounded-md font-medium">
                  ORIGINAL
                </div>
              </div>
              <p className="text-sm text-center text-gray-600 font-medium">Your Product Image</p>
            </div>
            
            <div className="space-y-3">
              <div className="relative">
                <div className="w-full h-48 border-2 border-purple-200 rounded-lg bg-white flex items-center justify-center">
                  {enhancedUrl ? (
                    <>
                      <img 
                        src={enhancedUrl} 
                        alt="Enhanced" 
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 text-xs rounded-md font-medium">
                        ENHANCED
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Sparkles className="h-12 w-12 mx-auto text-purple-400 mb-3" />
                      <p className="text-sm text-purple-600 font-medium">Professional Result</p>
                      <p className="text-xs text-purple-400">Ready for your store</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-sm text-center text-purple-600 font-medium">Shopify-Ready Product</p>
            </div>
          </div>

          {/* Enhancement Settings */}
          <EnhancementSettings
            backgroundType={backgroundType}
            setBackgroundType={setBackgroundType}
            imageSize={imageSize}
            setImageSize={setImageSize}
            backgroundOptions={backgroundOptions}
            sizeOptions={sizeOptions}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button 
              onClick={enhanceForShopify}
              size="lg"
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold h-12"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                  Creating Professional Image...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create Professional Image
                </>
              )}
            </Button>
            
            <Button 
              onClick={resetSettings}
              variant="outline"
              size="lg"
              className="px-6 h-12 border-purple-200 hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Download Section */}
          {enhancedUrl && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-800 mb-1">✨ Your professional image is ready!</h3>
                  <p className="text-sm text-green-600">
                    Enhanced with {backgroundOptions.find(b => b.value === backgroundType)?.label} background at {imageSize} resolution
                  </p>
                </div>
                <Button 
                  onClick={downloadImage}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• <strong>Studio White:</strong> Perfect for most products, provides clean professional look</li>
            <li>• <strong>2048×2048:</strong> Recommended size for Shopify with zoom functionality</li>
            <li>• <strong>Transparent PNG:</strong> Ideal for products that need to overlay on different backgrounds</li>
            <li>• <strong>Premium Gradient:</strong> Adds subtle depth and premium feel to your products</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

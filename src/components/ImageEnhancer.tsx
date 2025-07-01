import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { OpenAIKeyInput } from './ImageEnhancer/OpenAIKeyInput';
import { ImageComparison } from './ImageEnhancer/ImageComparison';
import { EnhancementSettings } from './ImageEnhancer/EnhancementSettings';
import { SuccessSection } from './ImageEnhancer/SuccessSection';
import { convertImageToBase64, enhanceImageWithCanvas, searchSimilarProduct } from './ImageEnhancer/imageUtils';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  detectionResult?: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, detectionResult, onEnhancedImage }: ImageEnhancerProps) => {
  const [backgroundType, setBackgroundType] = useState('professional-white');
  const [imageSize, setImageSize] = useState('2048x2048');
  const [enhancedUrl, setEnhancedUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Enhanced Shopify background options with studio effects
  const backgroundOptions = [
    { 
      value: 'professional-white', 
      label: 'Studio Pure White', 
      color: '#FFFFFF', 
      description: 'Clean white with professional shadows' 
    },
    { 
      value: 'soft-white', 
      label: 'Soft Studio White', 
      color: '#FEFEFE', 
      description: 'Warm white with subtle lighting' 
    },
    { 
      value: 'gradient-white', 
      label: 'Premium Studio Gradient', 
      color: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)', 
      description: 'Gradient background with depth' 
    },
    { 
      value: 'light-gray', 
      label: 'Studio Light Gray', 
      color: '#F5F5F5', 
      description: 'Professional neutral background' 
    },
    { 
      value: 'transparent', 
      label: 'Transparent (PNG)', 
      color: 'transparent', 
      description: 'No background, PNG format' 
    },
  ];

  // Professional Shopify-optimized image sizes
  const sizeOptions = [
    { 
      value: '2048x2048', 
      label: '2048×2048 - Shopify Premium', 
      recommended: true, 
      description: 'Best quality with zoom support' 
    },
    { 
      value: '1024x1024', 
      label: '1024×1024 - Shopify Standard', 
      description: 'Perfect balance of quality & speed' 
    },
    { 
      value: '2000x2000', 
      label: '2000×2000 - Shopify Plus', 
      description: 'High-end store quality' 
    },
    { 
      value: '800x800', 
      label: '800×800 - Mobile Optimized', 
      description: 'Fast loading for mobile users' 
    },
  ];

  const enhanceWithOnlineSearch = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key');
      return;
    }

    if (!detectionResult) {
      toast.error('No object detection results available. Please analyze the image first.');
      return;
    }

    setIsEnhancing(true);
    
    try {
      // Extract product information from detection results
      const productInfo = extractProductInfo(detectionResult);
      console.log('Extracted product info:', productInfo);
      
      if (!productInfo) {
        throw new Error('Could not extract product information from detection results');
      }

      // Search for similar product online
      const searchResult = await searchSimilarProduct(productInfo, apiKey);
      
      if (searchResult) {
        setEnhancedUrl(searchResult);
        onEnhancedImage?.(searchResult);
        toast.success('Found similar product image online!');
      } else {
        throw new Error('No similar product found online');
      }

    } catch (error) {
      console.error('Online search enhancement error:', error);
      toast.error(`Online search failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using advanced canvas enhancement instead.`);
      await enhanceForShopify();
    } finally {
      setIsEnhancing(false);
    }
  };

  const extractProductInfo = (detectionText: string): string | null => {
    // Extract the main product/object from detection results
    const lines = detectionText.split('\n');
    const objectLines = lines.filter(line => 
      line.toLowerCase().includes('object:') || 
      line.toLowerCase().includes('product:') ||
      line.toLowerCase().includes('item:')
    );
    
    if (objectLines.length === 0) {
      // Try to find any meaningful product description
      const meaningfulLines = lines.filter(line => 
        line.trim().length > 10 && 
        !line.toLowerCase().includes('coordinate') &&
        !line.toLowerCase().includes('pixel') &&
        !line.toLowerCase().includes('location')
      );
      
      if (meaningfulLines.length > 0) {
        return meaningfulLines[0].replace(/^(Object:|Product:|Item:)/i, '').trim();
      }
      return null;
    }
    
    // Get the first detected object and clean it up
    const firstObject = objectLines[0];
    return firstObject.replace(/^(Object:|Product:|Item:)/i, '').split(' at ')[0].trim();
  };

  const enhanceForShopify = async () => {
    setIsProcessing(true);
    
    try {
      console.log(`Enhancing image with ${backgroundType} background at ${imageSize} size`);
      const url = await enhanceImageWithCanvas(imageUrl, backgroundType, imageSize);
      setEnhancedUrl(url);
      onEnhancedImage?.(url);
      toast.success('Professional Shopify enhancement complete with studio effects!');
    } catch (error) {
      console.error('Professional enhancement failed:', error);
      toast.error('Enhancement failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadShopifyImage = () => {
    const link = document.createElement('a');
    link.href = enhancedUrl;
    const fileExtension = backgroundType === 'transparent' ? 'png' : 'jpg';
    const cleanName = imageName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    link.download = `shopify-ready-${cleanName}-${imageSize}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded: shopify-ready-${cleanName}-${imageSize}.${fileExtension}`);
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
          AI-Powered Product Enhancement
        </CardTitle>
        <p className="text-sm text-blue-600">Find similar products online or enhance with professional backgrounds</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <OpenAIKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          onEnhance={enhanceWithOnlineSearch}
          isEnhancing={isEnhancing}
        />

        <ImageComparison
          originalUrl={imageUrl}
          enhancedUrl={enhancedUrl}
        />

        <EnhancementSettings
          backgroundType={backgroundType}
          setBackgroundType={setBackgroundType}
          imageSize={imageSize}
          setImageSize={setImageSize}
          backgroundOptions={backgroundOptions}
          sizeOptions={sizeOptions}
        />

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
                Create Professional Image (Canvas)
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

        {enhancedUrl && (
          <SuccessSection onDownload={downloadShopifyImage} />
        )}
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { OpenAIKeyInput } from './ImageEnhancer/OpenAIKeyInput';
import { ImageComparison } from './ImageEnhancer/ImageComparison';
import { EnhancementSettings } from './ImageEnhancer/EnhancementSettings';
import { SuccessSection } from './ImageEnhancer/SuccessSection';
import { convertImageToBase64, enhanceImageWithCanvas } from './ImageEnhancer/imageUtils';

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

  const enhanceWithOpenAI = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key');
      return;
    }

    setIsEnhancing(true);
    
    try {
      const base64Image = await convertImageToBase64(imageUrl);
      
      // Create a simple white background mask for the edit
      const maskCanvas = document.createElement('canvas');
      const maskCtx = maskCanvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageUrl;
      });
      
      maskCanvas.width = img.width;
      maskCanvas.height = img.height;
      
      if (maskCtx) {
        // Create a minimal mask - just around the edges for background cleanup
        maskCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        // Keep the center area (product) mostly untouched
        maskCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        const centerX = maskCanvas.width * 0.2;
        const centerY = maskCanvas.height * 0.2;
        const centerWidth = maskCanvas.width * 0.6;
        const centerHeight = maskCanvas.height * 0.6;
        maskCtx.fillRect(centerX, centerY, centerWidth, centerHeight);
      }
      
      const maskBase64 = maskCanvas.toDataURL('image/png');
      
      // Prepare form data for the API call
      const formData = new FormData();
      
      // Convert base64 to blob for the original image
      const originalBlob = await fetch(base64Image).then(r => r.blob());
      formData.append('image', originalBlob, 'image.png');
      
      // Convert mask to blob
      const maskBlob = await fetch(maskBase64).then(r => r.blob());
      formData.append('mask', maskBlob, 'mask.png');
      
      formData.append('prompt', `Clean white background product photo. Keep the product EXACTLY as it is - same colors, same lighting, same details. Only clean up the background to be pure white and professional. Maintain all product details and characteristics. Subtle enhancement only.`);
      formData.append('n', '1');
      formData.append('size', '1024x1024');
      
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const enhancedImageUrl = data.data[0]?.url;
      
      if (enhancedImageUrl) {
        setEnhancedUrl(enhancedImageUrl);
        onEnhancedImage?.(enhancedImageUrl);
        toast.success('Image enhanced with AI while preserving original details!');
      } else {
        throw new Error('No enhanced image received from OpenAI');
      }

    } catch (error) {
      console.error('OpenAI enhancement error:', error);
      toast.error(`AI enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}. Using advanced canvas enhancement instead.`);
      await enhanceForShopify();
    } finally {
      setIsEnhancing(false);
    }
  };

  const enhanceForShopify = async () => {
    setIsProcessing(true);
    
    try {
      const url = await enhanceImageWithCanvas(imageUrl, backgroundType, imageSize);
      setEnhancedUrl(url);
      onEnhancedImage?.(url);
      toast.success('Professional Shopify image enhancement complete!');
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
        <OpenAIKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          onEnhance={enhanceWithOpenAI}
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

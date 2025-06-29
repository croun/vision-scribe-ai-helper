
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
      const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Data,
          prompt: "Enhance this image to match the style of a Shopify product photo. Focus on the following: - Make the product the visual focus. - Clean or remove the background, ideally making it white or light neutral. - Improve brightness and contrast to simulate studio lighting. - Sharpen the product edges for clarity. - Enhance color accuracy and saturation. - Maintain a natural look with soft shadows (if applicable). - Ensure the image looks polished and ready for an e-commerce storefront. Return only the enhanced version of the image.",
          n: 1,
          size: "1024x1024"
        }),
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
        toast.success('Image enhanced successfully with AI! Professional Shopify-ready image created.');
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

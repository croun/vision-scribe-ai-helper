import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Download, ShoppingBag, Package, Sparkles, Eye, Wand } from 'lucide-react';
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
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

  const analyzeWithOpenAI = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4.1-2025-04-14",
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: "Analyze this product image for Shopify e-commerce optimization. Provide:\n1. Product identification and category\n2. Current image quality assessment\n3. Specific recommendations for Shopify optimization (lighting, background, positioning)\n4. Suggested product title and description for maximum sales appeal\n5. Color and contrast adjustments needed\n6. Overall professional enhancement suggestions\n\nBe specific and actionable for e-commerce success." 
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                    detail: "high"
                  }
                }
              ]
            }
          ],
          max_tokens: 1500,
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.choices[0]?.message?.content;
      
      if (analysis) {
        setAiAnalysis(analysis);
        toast.success('AI analysis completed! Check the recommendations below.');
      } else {
        throw new Error('No analysis result received');
      }

    } catch (error) {
      console.error('OpenAI analysis error:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
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
          
          // Professional product sizing (80% for better visual impact)
          const scale = Math.min(width / img.width, height / img.height) * 0.8;
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          // Center the product perfectly
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;
          
          // Professional shadow effect (except for transparent)
          if (backgroundType !== 'transparent') {
            if (backgroundType === 'soft-white' || backgroundType === 'professional-white') {
              // Soft professional shadow
              ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
              ctx.shadowBlur = 20;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 12;
            } else {
              // Subtle shadow for other backgrounds
              ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
              ctx.shadowBlur = 15;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 8;
            }
          }
          
          // Draw the enhanced product image
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
          
          // Reset shadow
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // Professional image enhancement
          if (backgroundType !== 'transparent') {
            // Subtle brightness/contrast enhancement
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
              // Slight brightness and contrast boost for professional look
              data[i] = Math.min(255, data[i] * 1.05);     // Red
              data[i + 1] = Math.min(255, data[i + 1] * 1.05); // Green  
              data[i + 2] = Math.min(255, data[i + 2] * 1.05); // Blue
            }
            
            ctx.putImageData(imageData, 0, 0);
          }
          
          // Convert to optimized format
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setEnhancedUrl(url);
              onEnhancedImage?.(url);
            }
            setIsProcessing(false);
          }, backgroundType === 'transparent' ? 'image/png' : 'image/jpeg', 0.92);
        }
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    } catch (error) {
      console.error('Professional enhancement failed:', error);
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
    setAiAnalysis('');
  };

  return (
    <Card className="w-full border-2 border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
          <Sparkles className="h-5 w-5" />
          AI-Powered Shopify Enhancement
        </CardTitle>
        <p className="text-sm text-blue-600">Let AI analyze and optimize your product for maximum sales appeal</p>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* OpenAI Integration */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
              <Eye className="h-4 w-4" />
              AI Product Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="text-sm">OpenAI API Key</Label>
              <input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-orange-200 rounded-md text-sm font-mono"
              />
            </div>
            <Button 
              onClick={analyzeWithOpenAI}
              disabled={!apiKey.trim() || isAnalyzing}
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isAnalyzing ? (
                <>
                  <Eye className="h-3 w-3 mr-2 animate-pulse" />
                  Analyzing Product...
                </>
              ) : (
                <>
                  <Wand className="h-3 w-3 mr-2" />
                  Get AI Enhancement Tips
                </>
              )}
            </Button>
            
            {aiAnalysis && (
              <div className="mt-3 p-3 bg-white border border-orange-200 rounded-md">
                <Label className="text-sm font-semibold text-orange-700 mb-2 block">AI Recommendations:</Label>
                <Textarea
                  value={aiAnalysis}
                  readOnly
                  className="min-h-[150px] text-sm resize-none border-orange-200"
                />
              </div>
            )}
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
                <li>• Clean, professional background perfect for sales</li>
                <li>• High-resolution quality for product zoom</li>
                <li>• Optimized colors and contrast for appeal</li>
                <li>• Professional shadows and lighting effects</li>
                <li>• Perfect square format for consistent display</li>
                <li>• Shopify-optimized file size for fast loading</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

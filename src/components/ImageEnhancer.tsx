import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles, Download, RefreshCw, Palette, Settings, Zap, Crown, Shield, Wand2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancementSettings } from './ImageEnhancer/EnhancementSettings';
import { enhanceImageWithCanvas, removeBackground, loadImage, reimagineProductImage } from './ImageEnhancer/imageUtils';

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
  const [backgroundRemovedUrl, setBackgroundRemovedUrl] = useState<string>('');
  const [reimaginedUrl, setReimagineUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isReimagining, setIsReimagining] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Professional backgrounds optimized for Shopify
  const backgroundOptions = [
    { 
      value: 'studio-white', 
      label: 'Studio White', 
      color: '#FFFFFF', 
      description: 'Pure white professional background',
      premium: false
    },
    { 
      value: 'soft-studio', 
      label: 'Soft Studio', 
      color: '#FAFAFA', 
      description: 'Soft white with subtle vignette',
      premium: false
    },
    { 
      value: 'premium-gradient', 
      label: 'Premium Gradient', 
      color: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #f1f3f4 100%)', 
      description: 'Elegant gradient with depth',
      premium: true
    },
    { 
      value: 'light-neutral', 
      label: 'Light Neutral', 
      color: '#F5F5F5', 
      description: 'Professional neutral with texture',
      premium: false
    },
    { 
      value: 'transparent', 
      label: 'Transparent PNG', 
      color: 'transparent', 
      description: 'No background, crystal clear PNG',
      premium: true
    },
  ];

  // Shopify-optimized sizes with recommendations
  const sizeOptions = [
    { 
      value: '2048x2048', 
      label: '2048×2048 - Premium', 
      recommended: true, 
      description: 'Best quality with zoom support',
      premium: true
    },
    { 
      value: '1024x1024', 
      label: '1024×1024 - Standard', 
      description: 'Perfect balance of quality & speed',
      premium: false
    },
    { 
      value: '2000x2000', 
      label: '2000×2000 - High-End', 
      description: 'Premium store quality',
      premium: true
    },
    { 
      value: '800x800', 
      label: '800×800 - Mobile', 
      description: 'Optimized for mobile commerce',
      premium: false
    },
  ];

  const handleRemoveBackground = async () => {
    setIsRemovingBackground(true);
    
    try {
      console.log('Removing background from image...');
      toast.loading('Removing background...', { id: 'bg-removal-loading' });
      
      // Load the image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const imageElement = await loadImage(blob);
      
      // Remove background
      const backgroundRemovedBlob = await removeBackground(imageElement);
      const url = URL.createObjectURL(backgroundRemovedBlob);
      setBackgroundRemovedUrl(url);
      
      toast.dismiss('bg-removal-loading');
      toast.success('✨ Background removed successfully!', {
        description: 'Your product is now isolated and ready for enhancement.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      toast.dismiss('bg-removal-loading');
      toast.error('Background removal failed. Please try again.', {
        description: 'There was an issue processing your image.',
      });
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleReimagineProduct = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key first');
      return;
    }

    setIsReimagining(true);
    
    try {
      console.log('Reimagining product for customer appeal...');
      toast.loading('Reimagining your product...', { id: 'reimagine-loading' });
      
      const sourceUrl = backgroundRemovedUrl || imageUrl;
      const reimaginedImageUrl = await reimagineProductImage(sourceUrl, apiKey);
      
      if (reimaginedImageUrl) {
        setReimagineUrl(reimaginedImageUrl);
        toast.dismiss('reimagine-loading');
        toast.success('🎨 Product reimagined successfully!', {
          description: 'Your product has been transformed into a more customer-friendly version.',
          duration: 4000,
        });
      } else {
        throw new Error('Failed to reimagine product');
      }
    } catch (error) {
      console.error('Product reimagining failed:', error);
      toast.dismiss('reimagine-loading');
      toast.error('Product reimagining failed. Please try again.', {
        description: 'There was an issue reimagining your product.',
      });
    } finally {
      setIsReimagining(false);
    }
  };

  const enhanceForShopify = async () => {
    setIsProcessing(true);
    
    try {
      console.log(`Creating professional product image with ${backgroundType} background at ${imageSize}`);
      toast.loading('Processing your product image...', { id: 'enhance-loading' });
      
      const sourceUrl = reimaginedUrl || backgroundRemovedUrl || imageUrl;
      const url = await enhanceImageWithCanvas(sourceUrl, backgroundType, imageSize);
      setEnhancedUrl(url);
      onEnhancedImage?.(url);
      
      toast.dismiss('enhance-loading');
      toast.success('✨ Professional product image created successfully!', {
        description: 'Your Shopify-ready image is now ready for download.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.dismiss('enhance-loading');
      toast.error('Enhancement failed. Please try again.', {
        description: 'There was an issue processing your image.',
      });
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
    const fileName = `shopify-pro-${cleanName}-${imageSize.replace('x', 'x')}.${fileExtension}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`📥 Downloaded: ${fileName}`, {
      description: 'Your professional product image is saved and ready to upload to Shopify!',
      duration: 3000,
    });
  };

  const resetSettings = () => {
    setBackgroundType('studio-white');
    setImageSize('2048x2048');
    setEnhancedUrl('');
    toast.info('Settings reset to default', { duration: 2000 });
  };

  return (
    <div className="space-y-6">
      {/* Background Removal & Reimagining Card */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
          <CardTitle className="text-xl flex items-center gap-3 text-blue-800">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wand2 className="h-6 w-6 text-blue-600" />
            </div>
            AI Product Enhancement Pipeline
            <div className="ml-auto flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="h-3 w-3" />
              AI POWERED
            </div>
          </CardTitle>
          <p className="text-sm text-blue-700 leading-relaxed">Remove background and reimagine your product into a more customer-friendly version</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Original Image */}
            <div className="space-y-4">
              <div className="relative group">
                <img 
                  src={imageUrl} 
                  alt="Original" 
                  className="w-full h-40 object-contain border-2 border-gray-200 rounded-xl bg-gray-50/50 transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                  ORIGINAL
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">Your Product</p>
                <p className="text-xs text-gray-500">Starting point</p>
              </div>
            </div>
            
            {/* Background Removed */}
            <div className="space-y-4">
              <div className="relative group">
                <div className="w-full h-40 border-2 border-dashed border-blue-300 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center transition-all group-hover:border-blue-400">
                  {backgroundRemovedUrl ? (
                    <>
                      <img 
                        src={backgroundRemovedUrl} 
                        alt="Background Removed" 
                        className="w-full h-full object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                        BG REMOVED
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-blue-600 rounded-full flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-700">Isolated Product</p>
                        <p className="text-xs text-blue-500">Clean background removal</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleRemoveBackground}
                disabled={isRemovingBackground}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {isRemovingBackground ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Remove Background
                  </>
                )}
              </Button>
            </div>

            {/* Reimagined Product */}
            <div className="space-y-4">
              <div className="relative group">
                <div className="w-full h-40 border-2 border-dashed border-purple-300 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center transition-all group-hover:border-purple-400">
                  {reimaginedUrl ? (
                    <>
                      <img 
                        src={reimaginedUrl} 
                        alt="Reimagined" 
                        className="w-full h-full object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                        REIMAGINED
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                        <Wand2 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-700">Customer-Friendly</p>
                        <p className="text-xs text-purple-500">AI-reimagined for sales</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label htmlFor="openai-key" className="text-xs">OpenAI API Key</Label>
                  <input
                    id="openai-key"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-2 py-1 border border-purple-200 rounded text-xs font-mono"
                  />
                </div>
                <Button 
                  onClick={handleReimagineProduct}
                  disabled={isReimagining || !apiKey.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  {isReimagining ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                      Reimagining...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Reimagine Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Enhancement Card */}
      <Card className="border-2 border-purple-100 bg-gradient-to-br from-white via-purple-50/20 to-blue-50/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-b border-purple-100">
          <CardTitle className="text-xl flex items-center gap-3 text-purple-800">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            Professional Product Enhancement
            <div className="ml-auto flex items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              <Crown className="h-3 w-3" />
              SHOPIFY PRO
            </div>
          </CardTitle>
          <p className="text-sm text-purple-700 leading-relaxed">Transform your product images into stunning, professional Shopify-ready shots with advanced AI enhancement</p>
        </CardHeader>
        <CardContent className="p-8">
          {/* Enhanced Image Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <div className="relative group">
                <img 
                  src={reimaginedUrl || backgroundRemovedUrl || imageUrl} 
                  alt="Source" 
                  className="w-full h-56 object-contain border-2 border-gray-200 rounded-xl bg-gray-50/50 transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                  SOURCE
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  {reimaginedUrl ? 'Reimagined Product' : backgroundRemovedUrl ? 'Background Removed' : 'Original Image'}
                </p>
                <p className="text-xs text-gray-500">Ready for enhancement</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <div className="w-full h-56 border-2 border-dashed border-purple-300 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center transition-all group-hover:border-purple-400">
                  {enhancedUrl ? (
                    <>
                      <img 
                        src={enhancedUrl} 
                        alt="Enhanced" 
                        className="w-full h-full object-contain rounded-xl transition-transform group-hover:scale-[1.02]"
                      />
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          ENHANCED
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-600/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="relative">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                          <Sparkles className="h-8 w-8 text-white animate-pulse" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Crown className="h-3 w-3 text-yellow-800" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-700">Professional Result</p>
                        <p className="text-xs text-purple-500">Shopify-ready perfection</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-purple-700 mb-1">Shopify-Ready Product</p>
                <p className="text-xs text-purple-500">Professional enhancement applied</p>
              </div>
            </div>
          </div>

          {/* Enhanced Settings */}
          <div className="bg-gray-50/50 rounded-xl p-6 mb-6">
            <EnhancementSettings
              backgroundType={backgroundType}
              setBackgroundType={setBackgroundType}
              imageSize={imageSize}
              setImageSize={setImageSize}
              backgroundOptions={backgroundOptions}
              sizeOptions={sizeOptions}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={enhanceForShopify}
              size="lg"
              className="flex-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold h-14 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    <span>Creating Professional Image...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span>Create Professional Image</span>
                    <Crown className="h-4 w-4" />
                  </div>
                </>
              )}
            </Button>
            
            <Button 
              onClick={resetSettings}
              variant="outline"
              size="lg"
              className="px-8 h-14 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Enhanced Download Section */}
          {enhancedUrl && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-800 text-lg mb-2">✨ Your Professional Image is Ready!</h3>
                  <p className="text-sm text-green-700 mb-4 leading-relaxed">
                    Enhanced with <span className="font-semibold">{backgroundOptions.find(b => b.value === backgroundType)?.label}</span> background 
                    at <span className="font-semibold">{imageSize}</span> resolution. Optimized for Shopify with professional lighting, 
                    color enhancement, and crystal-clear sharpening.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      <Sparkles className="h-3 w-3" />
                      Professional Lighting
                    </span>
                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      <Palette className="h-3 w-3" />
                      Color Enhanced
                    </span>
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                      <Zap className="h-3 w-3" />
                      HD Sharpened
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={downloadImage}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Pro Image
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Tips Card */}
      <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            Professional Enhancement Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-sm">Studio White</p>
                  <p className="text-xs text-blue-600">Perfect for most products, provides clean professional look</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-sm">Premium Gradient</p>
                  <p className="text-xs text-blue-600">Adds subtle depth and premium feel to your products</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-sm">2048×2048 Resolution</p>
                  <p className="text-xs text-blue-600">Recommended size for Shopify with zoom functionality</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-semibold text-sm">Transparent PNG</p>
                  <p className="text-xs text-blue-600">Ideal for products that need to overlay on different backgrounds</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

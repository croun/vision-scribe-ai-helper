
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles, Download, RefreshCw, Wand2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { reimagineProductImage } from './ImageEnhancer/imageUtils';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  detectionResult?: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, detectionResult, onEnhancedImage }: ImageEnhancerProps) => {
  const [reimaginedUrl, setReimagineUrl] = useState<string>('');
  const [isReimagining, setIsReimagining] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleReimagineProduct = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key first');
      return;
    }

    setIsReimagining(true);
    
    try {
      console.log('Reimagining product for customer appeal...');
      toast.loading('Reimagining your product...', { id: 'reimagine-loading' });
      
      const reimaginedImageUrl = await reimagineProductImage(imageUrl, apiKey);
      
      if (reimaginedImageUrl) {
        setReimagineUrl(reimaginedImageUrl);
        onEnhancedImage?.(reimaginedImageUrl);
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

  const downloadReimagined = () => {
    if (!reimaginedUrl) return;
    
    const link = document.createElement('a');
    link.href = reimaginedUrl;
    const cleanName = imageName.replace(/\.[^/.]+$/, "").replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const fileName = `reimagined-${cleanName}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`📥 Downloaded: ${fileName}`, {
      description: 'Your reimagined product image is saved!',
      duration: 3000,
    });
  };

  const resetSettings = () => {
    setReimagineUrl('');
    setApiKey('');
    toast.info('Reset completed', { duration: 2000 });
  };

  return (
    <div className="space-y-6">
      {/* AI Product Enhancement Pipeline */}
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
          <p className="text-sm text-blue-700 leading-relaxed">Reimagine your product into a more customer-friendly version</p>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Original Image */}
            <div className="space-y-4">
              <div className="relative group">
                <img 
                  src={imageUrl} 
                  alt="Original" 
                  className="w-full h-40 object-contain border-2 border-gray-200 rounded-xl bg-gray-50/50 transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                  SOURCE
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 mb-1">Original Image</p>
                <p className="text-xs text-gray-500">Ready for enhancement</p>
              </div>
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
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                        <div className="flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          ENHANCED
                        </div>
                      </div>
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
                        <p className="text-xs text-purple-500">Studio-ready perfection</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-purple-700 mb-1">Studio-Ready Product</p>
                <p className="text-xs text-purple-500">Professional enhancement applied</p>
              </div>
            </div>
          </div>

          {/* API Key Input */}
          <div className="bg-gray-50/50 rounded-xl p-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="openai-key" className="text-sm font-semibold text-gray-700">OpenAI API Key</Label>
              <input
                id="openai-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleReimagineProduct}
              size="lg"
              className="flex-1 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-semibold h-14 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isReimagining || !apiKey.trim()}
            >
              {isReimagining ? (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 animate-spin" />
                    <span>Reimagining Product...</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    <span>Reimagine Product</span>
                    <Crown className="h-4 w-4" />
                  </div>
                </>
              )}
            </Button>
            
            <Button 
              onClick={downloadReimagined}
              size="lg"
              className="px-8 h-14 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={!reimaginedUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
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
        </CardContent>
      </Card>
    </div>
  );
};

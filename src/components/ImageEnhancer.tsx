
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles, Download, RefreshCw, Wand2, Crown, ZoomIn } from 'lucide-react';
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
  const [showOriginalMagnify, setShowOriginalMagnify] = useState(false);
  const [showEnhancedMagnify, setShowEnhancedMagnify] = useState(false);

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const handleReimagineProduct = async () => {
    if (!apiKey?.trim()) {
      toast.error('OpenAI API key not found in environment variables');
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
    toast.info('Reset completed', { duration: 2000 });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Product Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <Wand2 className="h-6 w-6 text-blue-600" />
            Enhance Your Product
            <div className="ml-auto flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="h-3 w-3" />
              AI POWERED
            </div>
          </CardTitle>
          <p className="text-sm text-blue-700">Reimagine your product with advanced image enhancement tools</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Original Product */}
            <div className="space-y-4">
              <div className="relative group bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Original" 
                  className="w-full h-48 object-contain p-4"
                />
                <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1.5 text-xs rounded-lg font-semibold">
                  ORIGINAL
                </div>
                <button
                  onClick={() => setShowOriginalMagnify(true)}
                  className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">Your Product</p>
                <p className="text-xs text-gray-500">Starting point</p>
              </div>
            </div>

            {/* Enhanced Version */}
            <div className="space-y-4">
              <div className="relative group bg-white rounded-xl border-2 border-dashed border-purple-300 overflow-hidden">
                <div className="w-full h-48 flex items-center justify-center p-4">
                  {reimaginedUrl ? (
                    <>
                      <img 
                        src={reimaginedUrl} 
                        alt="Enhanced" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1.5 text-xs rounded-lg font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        ENHANCED
                      </div>
                      <button
                        onClick={() => setShowEnhancedMagnify(true)}
                        className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto bg-purple-600 rounded-full flex items-center justify-center">
                        <Wand2 className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-700">Enhanced Version</p>
                        <p className="text-xs text-purple-500">Reimagined for sales</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-purple-700">Enhanced Version</p>
                <p className="text-xs text-purple-500">Reimagined for sales</p>
              </div>
            </div>
          </div>

          {/* Reimagine Product Button */}
          <Button 
            onClick={handleReimagineProduct}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12 mb-4"
            disabled={isReimagining || !apiKey?.trim()}
          >
            {isReimagining ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Reimagining Product...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Reimagine Product
              </>
            )}
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={downloadReimagined}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!reimaginedUrl}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>

            <Button 
              onClick={resetSettings}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Magnify Modals */}
      {showOriginalMagnify && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowOriginalMagnify(false)}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <img 
              src={imageUrl} 
              alt="Original Magnified" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowOriginalMagnify(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showEnhancedMagnify && reimaginedUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEnhancedMagnify(false)}>
          <div className="max-w-4xl max-h-[90vh] relative">
            <img 
              src={reimaginedUrl} 
              alt="Enhanced Magnified" 
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowEnhancedMagnify(false)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

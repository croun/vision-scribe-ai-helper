import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Sparkles, Download, RefreshCw, Wand2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

interface ImageEnhancerProps {
  imageUrl: string;
  imageName: string;
  detectionResult?: string;
  onEnhancedImage?: (enhancedUrl: string) => void;
}

export const ImageEnhancer = ({ imageUrl, imageName, detectionResult, onEnhancedImage }: ImageEnhancerProps) => {
  const { user } = useAuth();
  const [reimaginedUrl, setReimagineUrl] = useState<string>('');
  const [isReimagining, setIsReimagining] = useState(false);
  const [showOriginalMagnify, setShowOriginalMagnify] = useState(false);
  const [showEnhancedMagnify, setShowEnhancedMagnify] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleReimagineProduct = async () => {
    if (!user) {
      toast.error('Please login to use this feature');
      return;
    }

    setIsReimagining(true);
    
    try {
      toast.loading('Reimagining your product...', { id: 'reimagine-loading' });
      
      // 1. Convert image URL to File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], imageName, { type: blob.type });

      // 2. Upload to temporary storage
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      const uploadResponse = await fetch('/api/upload-temp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: uploadFormData
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      const { url: uploadedUrl } = await uploadResponse.json();

      // 3. Call enhancement endpoint
      const enhanceResponse = await fetch('/api/products/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ 
          image_url: uploadedUrl,
          prompt: customPrompt 
        })
      });

      if (!enhanceResponse.ok) {
        const errorData = await enhanceResponse.json();
        throw new Error(errorData.error || 'Enhancement failed');
      }

      const { enhanced_url } = await enhanceResponse.json();
      setReimagineUrl(enhanced_url);
      onEnhancedImage?.(enhanced_url);
      
      toast.dismiss('reimagine-loading');
      toast.success('🎨 Product reimagined successfully!', {
        description: 'Your product has been transformed into a more customer-friendly version.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Product reimagining failed:', error);
      toast.dismiss('reimagine-loading');
      toast.error('Product reimagining failed. Please try again.', {
        description: error instanceof Error ? error.message : 'There was an issue reimagining your product.',
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
      {/* Enhanced Product Card - ALL UI REMAINS EXACTLY THE SAME */}
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
          {/* Original and Enhanced Image Comparison */}
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
                  onClick={() => reimaginedUrl ? setShowComparison(true) : setShowOriginalMagnify(true)}
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
                        onClick={() => setShowComparison(true)}
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

          {/* Custom Enhancement Instructions */}
          <div className="bg-white/50 rounded-xl p-4 mb-6">
            <Label htmlFor="custom-prompt" className="text-sm font-medium text-gray-700 mb-2 block">
              Custom Enhancement Instructions (Optional)
            </Label>
            <textarea
              id="custom-prompt"
              placeholder="Describe specific changes you want for the enhanced version..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-20"
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be added to the enhancement prompt to customize the output
            </p>
          </div>

          {/* Reimagine Product Button */}
          <Button 
            onClick={handleReimagineProduct}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12 mb-4"
            disabled={isReimagining || !user}
          >
            {isReimagining ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Reimagining Product...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                {user ? 'Reimagine Product' : 'Login to Reimagine'}
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

      {/* Magnify Modals - ALL MODAL CODE REMAINS EXACTLY THE SAME */}
      {showOriginalMagnify && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowOriginalMagnify(false)}>
          {/* ... existing modal code ... */}
        </div>
      )}

      {showEnhancedMagnify && reimaginedUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEnhancedMagnify(false)}>
          {/* ... existing modal code ... */}
        </div>
      )}

      {/* Before & After Comparison Modal */}
      {showComparison && reimaginedUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowComparison(false)}>
          {/* ... existing comparison modal code ... */}
        </div>
      )}
    </div>
  );
};

export default ImageEnhancer;
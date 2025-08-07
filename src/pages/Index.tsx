import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Eye, Loader2, AlertCircle, Scissors, Download, Wand2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/ImageCropper';
import { ImageEnhancer } from '@/components/ImageEnhancer';
import { reimagineProductImage } from '@/components/ImageEnhancer/imageUtils';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [reimaginedUrl, setReimagineUrl] = useState<string>('');
  const [isReimagining, setIsReimagining] = useState(false);

  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setShowCropper(false);
        setReimagineUrl('');
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleReimagineProduct = async () => {
    if (!apiKey?.trim()) {
      toast.error('OpenAI API key not found in environment variables');
      return;
    }

    if (!imagePreview) {
      toast.error('Please select an image first');
      return;
    }

    setIsReimagining(true);
    
    try {
      console.log('Reimagining product for customer appeal...');
      toast.loading('Reimagining your product...', { id: 'reimagine-loading' });
      
      const reimaginedImageUrl = await reimagineProductImage(imagePreview, apiKey);
      
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

  const downloadReimagined = () => {
    if (!reimaginedUrl) return;
    
    const link = document.createElement('a');
    link.href = reimaginedUrl;
    const fileName = `reimagined-${selectedImage?.name?.replace(/\.[^/.]+$/, '') || 'product'}.png`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`📥 Downloaded: ${fileName}`, {
      description: 'Your reimagined product image is saved!',
      duration: 3000,
    });
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      toast.error('Please select an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setDetectionResult('');

    try {
      const base64Image = await convertImageToBase64(selectedImage);

      // Use Vite env variable for OpenAI API key (for development only)
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        toast.error('OpenAI API key is not set in your environment variables.');
        setIsAnalyzing(false);
        return;
      }

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
                  text: "Analyze this image and identify the main product/object. Provide:\n1. Primary product name/description\n2. Product category\n3. Key visual characteristics\n4. Brand or style if visible\n\nFocus on the most prominent product in the image. Format like this:\nProduct: [detailed product name and description]\nCategory: [product category]\nCharacteristics: [key visual features]\nStyle: [brand/style if visible]" 
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image,
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
      const result = data.choices[0]?.message?.content;
      
      if (result) {
        setDetectionResult(result);
        setShowCropper(true);
        toast.success('Product analysis completed! You can now crop and enhance your image.');
      } else {
        throw new Error('No analysis result received');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDetectionResult('Analysis failed. Please check your API key and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Eye className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Productify
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your product, Crop, and create a professional image with advanced enhancement tools.
          </p>
        </div>

        {/* API Status Alert */}
        {/* <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              OpenAI API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {apiKey ? (
                  <span className="text-green-600">✅ OpenAI API key is configured and ready to use!</span>
                ) : (
                  <span className="text-red-600">❌ OpenAI API key not found. Please check your environment variables.</span>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card> */}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Upload and Analysis */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Select a product image file</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                </div>

                <Button 
                  onClick={analyzeImage}
                  disabled={!selectedImage || !apiKey?.trim() || isAnalyzing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Product...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Crop Image
                    </>
                  )}
                </Button>

                {/* Object Cropper moved here */}
                {showCropper && imagePreview && (
                  <div className="mt-6">
                    <ImageCropper 
                      imageUrl={imagePreview}
                      detectionResult={detectionResult}
                      onCropComplete={(croppedUrl) => {
                        console.log('Cropped product image created:', croppedUrl);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Product Enhancement Pipeline - Simplified */}
          <div className="space-y-6">
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
                <CardTitle className="text-xl flex items-center gap-3 text-blue-800">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Wand2 className="h-6 w-6 text-blue-600" />
                  </div>
                  Enhance Your Product
                  <div className="ml-auto flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    <Sparkles className="h-3 w-3" />
                    AI POWERED
                  </div>
                </CardTitle>
                <p className="text-sm text-blue-700 leading-relaxed">Reimagine your product with advanced image enhancement tools</p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Original Image */}
                  <div className="space-y-4">
                    <div className="relative group">
                      {imagePreview ? (
                        <>
                          <img 
                            src={imagePreview} 
                            alt="Original" 
                            className="w-full h-40 object-contain border-2 border-gray-200 rounded-xl bg-gray-50/50 transition-transform group-hover:scale-[1.02]"
                          />
                          <div className="absolute top-3 left-3 bg-gray-800 text-white px-3 py-1.5 text-xs rounded-lg font-semibold shadow-lg">
                            ORIGINAL
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <Upload className="h-8 w-8 mx-auto text-gray-400" />
                            <p className="text-sm text-gray-500">Upload an image first</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Your Product</p>
                      <p className="text-xs text-gray-500">Starting point</p>
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
                              <p className="text-sm font-semibold text-purple-700">Enhanced Version</p>
                              <p className="text-xs text-purple-500">Reimagined for sales</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        onClick={handleReimagineProduct}
                        disabled={isReimagining || !apiKey?.trim() || !imagePreview}
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
                      {reimaginedUrl && (
                        <Button 
                          onClick={downloadReimagined}
                          variant="outline"
                          className="w-full"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Reimagined
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Upload a product image file (JPG, PNG, etc.)</li>
              <li>Click "Crop" to specify the product</li>
              <li>Use the manual cropper to select specific areas of your product</li>
              <li>Enhance cropped objects using the AI enhancement tools</li>
              <li>Download your enhanced product images</li>
            </ol>
            <p className="text-sm mt-4 text-green-600">
              The manual cropper gives you precise control over selecting product areas for enhancement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

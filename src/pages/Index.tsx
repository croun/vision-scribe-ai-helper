
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Eye, Loader2, AlertCircle, Scissors, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/ImageCropper';
import { ImageEnhancer } from '@/components/ImageEnhancer';

const Index = () => {
  const [apiKey, setApiKey] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [croppingMode, setCroppingMode] = useState<'manual' | 'auto'>('auto');
  const [autoCroppedImage, setAutoCroppedImage] = useState<string>('');

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setShowCropper(false);
        setAutoCroppedImage('');
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

  const createAutoCrop = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        
        // Set canvas to a standard square format for auto-crop
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        
        canvas.width = size;
        canvas.height = size;
        
        // Draw the center-cropped image
        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedUrl = URL.createObjectURL(blob);
            resolve(croppedUrl);
          } else {
            resolve(imageUrl);
          }
        }, 'image/png');
      };
      
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onerror = () => resolve(imageUrl);
    });
  };

  const analyzeImage = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your OpenAI API key');
      return;
    }

    if (!selectedImage) {
      toast.error('Please select an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setDetectionResult('');

    try {
      const base64Image = await convertImageToBase64(selectedImage);

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
        
        if (croppingMode === 'auto') {
          // Create auto-cropped image
          const croppedUrl = await createAutoCrop(imagePreview);
          setAutoCroppedImage(croppedUrl);
          toast.success('Product analysis completed! Auto-cropped image is ready for enhancement.');
        } else {
          setShowCropper(true);
          toast.success('Product analysis completed! You can now crop and enhance your image.');
        }
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
              AI Product Enhancement Studio
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload product images, let AI analyze them, and create professional Shopify-ready images with advanced enhancement tools.
          </p>
        </div>

        {/* API Key Input */}
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              OpenAI API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="apiKey">Enter your OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <Alert>
                <AlertDescription>
                  Your API key is only stored locally and never sent to our servers. 
                  Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI's platform</a>.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Image Upload and Analysis */}
          <div className="space-y-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload & Analyze Product
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

                {imagePreview && (
                  <>
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-auto max-h-64 object-contain rounded"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Cropping Mode</Label>
                      <RadioGroup
                        value={croppingMode}
                        onValueChange={(value: 'manual' | 'auto') => setCroppingMode(value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto" className="flex items-center gap-2 cursor-pointer">
                            <Zap className="h-4 w-4 text-green-600" />
                            Auto Crop (Center-focused)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="manual" id="manual" />
                          <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                            <Scissors className="h-4 w-4 text-blue-600" />
                            Manual Crop (Precise control)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}

                <Button 
                  onClick={analyzeImage}
                  disabled={!selectedImage || !apiKey.trim() || isAnalyzing}
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
                      Detect & Process Product
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Detection Results */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Product Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {detectionResult ? (
                  <Textarea
                    value={detectionResult}
                    readOnly
                    className="min-h-[200px] resize-none"
                    placeholder="Product analysis results will appear here..."
                  />
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    {isAnalyzing ? (
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                        <p>Analyzing your product...</p>
                      </div>
                    ) : (
                      <p>Upload a product image and click "Detect & Process Product" to see results</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Processing */}
          <div className="space-y-6">
            {showCropper && croppingMode === 'manual' && imagePreview ? (
              <ImageCropper 
                imageUrl={imagePreview}
                detectionResult={detectionResult}
                onCropComplete={(croppedUrl) => {
                  console.log('Cropped product image created:', croppedUrl);
                }}
              />
            ) : autoCroppedImage && croppingMode === 'auto' ? (
              <ImageEnhancer
                imageUrl={autoCroppedImage}
                imageName={selectedImage?.name || 'product'}
                detectionResult={detectionResult}
                onEnhancedImage={(enhancedUrl) => {
                  console.log('Enhanced image created:', enhancedUrl);
                }}
              />
            ) : (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Product Enhancement Studio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[300px] flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center space-y-2">
                      <Eye className="h-8 w-8 mx-auto text-gray-400" />
                      <p>Analyze a product first to enable enhancement</p>
                      <p className="text-xs">Choose auto-crop for instant results or manual crop for precision</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-green-700 space-y-2">
            <ol className="list-decimal list-inside space-y-2">
              <li>Enter your OpenAI API key in the configuration section above</li>
              <li>Upload a product image file (JPG, PNG, etc.)</li>
              <li>Choose between Auto Crop (instant center-focused crop) or Manual Crop (precise control)</li>
              <li>Click "Detect & Process Product" to analyze and process the image</li>
              <li>Use the professional enhancement tools to create Shopify-ready images</li>
              <li>Download your enhanced product images</li>
            </ol>
            <p className="text-sm mt-4 text-green-600">
              Auto Crop mode provides instant results, while Manual Crop gives you precise control over the cropping area.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

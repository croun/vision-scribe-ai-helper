import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Eye, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ImageCropper } from '@/components/ImageCropper';

const Index = () => {
  const [apiKey, setApiKey] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setShowCropper(false); // Reset cropper when new image is selected
      };
      reader.readAsDataURL(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/[type];base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(`data:${file.type};base64,${base64Data}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
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
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: "Analyze this image and provide detailed object detection results. List all objects you can identify, their approximate locations, and any notable details about them. Format your response clearly." 
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
          max_tokens: 1000,
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
        setShowCropper(true); // Show cropper after successful analysis
        toast.success('Image analysis completed! You can now crop detected objects.');
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
              AI Object Detection & Cropping Tool
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload an image, let AI identify objects, and crop them out for individual use. 
            Powered by OpenAI's advanced vision capabilities.
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
                  Upload & Analyze Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">Select an image file</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="cursor-pointer"
                  />
                </div>

                {imagePreview && (
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
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Detect Objects
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Detection Results */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Detection Results</CardTitle>
              </CardHeader>
              <CardContent>
                {detectionResult ? (
                  <Textarea
                    value={detectionResult}
                    readOnly
                    className="min-h-[200px] resize-none"
                    placeholder="Analysis results will appear here..."
                  />
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    {isAnalyzing ? (
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                        <p>Analyzing your image...</p>
                      </div>
                    ) : (
                      <p>Upload an image and click "Detect Objects" to see results</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Image Cropper */}
          <div>
            {showCropper && imagePreview ? (
              <ImageCropper 
                imageUrl={imagePreview}
                onCropComplete={(croppedUrl) => {
                  console.log('Cropped image created:', croppedUrl);
                }}
              />
            ) : (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle>Object Cropper</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="min-h-[300px] flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <div className="text-center space-y-2">
                      <Eye className="h-8 w-8 mx-auto text-gray-400" />
                      <p>Analyze an image first to enable cropping</p>
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
              <li>Upload an image file (JPG, PNG, etc.)</li>
              <li>Click "Detect Objects" to analyze the image</li>
              <li>Use the cropper to select and extract detected objects</li>
              <li>Download your cropped objects individually</li>
            </ol>
            <p className="text-sm mt-4 text-green-600">
              After analysis, click and drag on the image to select areas containing the objects you want to crop out.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;

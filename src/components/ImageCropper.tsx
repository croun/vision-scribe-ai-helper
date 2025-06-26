
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crop, Download, Loader2 } from 'lucide-react';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

interface ImageCropperProps {
  imageUrl: string;
  detectionResult?: string;
  onCropComplete?: (croppedImageUrl: string) => void;
}

export const ImageCropper = ({ imageUrl, detectionResult, onCropComplete }: ImageCropperProps) => {
  const [croppedImages, setCroppedImages] = useState<Array<{ url: string; label: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedAreas, setDetectedAreas] = useState<CropData[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse detection results to extract object locations
  const parseDetectionResults = useCallback((text: string): CropData[] => {
    const areas: CropData[] = [];
    
    // Try to extract coordinates from common patterns in AI responses
    const patterns = [
      // Pattern for "top-left (x,y) to bottom-right (x,y)"
      /(\w+[^:]*?).*?(?:top-?left|upper-?left|left).*?(?:\(|at|:)\s*(\d+)[,\s]+(\d+).*?(?:bottom-?right|lower-?right|right).*?(?:\(|to|:)\s*(\d+)[,\s]+(\d+)/gi,
      // Pattern for "x: 10, y: 20, width: 100, height: 50"
      /(\w+[^:]*?).*?x[:\s]*(\d+).*?y[:\s]*(\d+).*?width[:\s]*(\d+).*?height[:\s]*(\d+)/gi,
      // Pattern for "located at (x, y) with size (w, h)"
      /(\w+[^:]*?).*?(?:located|positioned).*?(?:\(|at)\s*(\d+)[,\s]+(\d+).*?(?:size|dimensions).*?(?:\()\s*(\d+)[,\s]+(\d+)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1].trim();
        let x, y, width, height;
        
        if (pattern === patterns[0]) {
          // top-left to bottom-right pattern
          x = parseInt(match[2]);
          y = parseInt(match[3]);
          width = parseInt(match[4]) - x;
          height = parseInt(match[5]) - y;
        } else {
          // direct coordinates pattern
          x = parseInt(match[2]);
          y = parseInt(match[3]);
          width = parseInt(match[4]);
          height = parseInt(match[5]);
        }
        
        if (x >= 0 && y >= 0 && width > 0 && height > 0) {
          areas.push({ x, y, width, height, label });
        }
      }
    });

    // If no specific coordinates found, create some default areas based on common object descriptions
    if (areas.length === 0 && text) {
      const objects = text.toLowerCase().match(/\b(?:person|car|dog|cat|tree|house|building|sign|book|phone|laptop|cup|bottle|chair|table|window|door)\b/g);
      if (objects && imageRef.current) {
        const imgWidth = imageRef.current.width;
        const imgHeight = imageRef.current.height;
        
        objects.slice(0, 4).forEach((obj, index) => {
          const gridX = (index % 2) * (imgWidth / 2) + imgWidth * 0.1;
          const gridY = Math.floor(index / 2) * (imgHeight / 2) + imgHeight * 0.1;
          areas.push({
            x: gridX,
            y: gridY,
            width: imgWidth * 0.3,
            height: imgHeight * 0.3,
            label: obj
          });
        });
      }
    }

    return areas;
  }, []);

  // Auto-crop when detection results change
  useEffect(() => {
    if (detectionResult && imageRef.current) {
      const areas = parseDetectionResults(detectionResult);
      setDetectedAreas(areas);
      
      if (areas.length > 0) {
        setTimeout(() => {
          autoCropDetectedObjects(areas);
        }, 100);
      }
    }
  }, [detectionResult, parseDetectionResults]);

  const autoCropDetectedObjects = useCallback(async (areas: CropData[]) => {
    if (!imageRef.current || !canvasRef.current || areas.length === 0) return;
    
    setIsProcessing(true);
    const newCroppedImages: Array<{ url: string; label: string }> = [];
    
    for (const area of areas) {
      const croppedUrl = await cropImageArea(area);
      if (croppedUrl) {
        newCroppedImages.push({
          url: croppedUrl,
          label: area.label || `Object ${newCroppedImages.length + 1}`
        });
        onCropComplete?.(croppedUrl);
      }
    }
    
    setCroppedImages(prev => [...prev, ...newCroppedImages]);
    setIsProcessing(false);
  }, [onCropComplete]);

  const cropImageArea = useCallback((cropData: CropData): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!imageRef.current || !canvasRef.current) {
        resolve(null);
        return;
      }
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const image = imageRef.current;
      
      if (!ctx) {
        resolve(null);
        return;
      }

      // Calculate scaling factors
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to crop size
      canvas.width = cropData.width * scaleX;
      canvas.height = cropData.height * scaleY;

      // Draw cropped portion
      ctx.drawImage(
        image,
        cropData.x * scaleX,
        cropData.y * scaleY,
        cropData.width * scaleX,
        cropData.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          resolve(croppedUrl);
        } else {
          resolve(null);
        }
      });
    });
  }, []);

  const downloadCroppedImage = useCallback((imageUrl: string, label: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${label.replace(/\s+/g, '-').toLowerCase()}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const clearCroppedImages = useCallback(() => {
    croppedImages.forEach(item => URL.revokeObjectURL(item.url));
    setCroppedImages([]);
    setDetectedAreas([]);
  }, [croppedImages]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Auto Object Cropper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative inline-block border-2 border-gray-200 rounded-lg overflow-hidden">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Source with detected objects"
                className="max-w-full h-auto"
                draggable={false}
              />
              
              {/* Show detected areas as overlays */}
              {detectedAreas.map((area, index) => (
                <div
                  key={index}
                  className="absolute border-2 border-green-500 bg-green-500 bg-opacity-20 pointer-events-none"
                  style={{
                    left: area.x,
                    top: area.y,
                    width: area.width,
                    height: area.height,
                  }}
                >
                  {area.label && (
                    <div className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded">
                      {area.label}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Auto-cropping detected objects...</span>
                </div>
              )}
              
              {croppedImages.length > 0 && (
                <Button 
                  onClick={clearCroppedImages}
                  variant="outline"
                >
                  Clear All Crops
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-600">
              Objects are automatically detected and cropped based on AI analysis results.
            </p>
          </div>
        </CardContent>
      </Card>

      {croppedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-Cropped Objects ({croppedImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {croppedImages.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img 
                      src={item.url} 
                      alt={item.label}
                      className="w-full h-auto max-h-32 object-contain rounded"
                    />
                  </div>
                  <div className="text-xs text-center text-gray-600 truncate">
                    {item.label}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadCroppedImage(item.url, item.label, index)}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

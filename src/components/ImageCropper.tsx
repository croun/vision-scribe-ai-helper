
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

  // Parse detection results to extract object locations and coordinates
  const parseDetectionResults = useCallback((text: string): CropData[] => {
    const areas: CropData[] = [];
    console.log('Parsing detection results:', text);
    
    // Multiple patterns to extract coordinates from AI responses
    const patterns = [
      // Pattern: "Object: [name] at x: 10, y: 20, width: 100, height: 50"
      /Object:\s*([^a-t]+?)\s*at\s+x:\s*(\d+),?\s*y:\s*(\d+),?\s*width:\s*(\d+),?\s*height:\s*(\d+)/gi,
      // Pattern: "x: 10, y: 20, width: 100, height: 50"
      /([^:\n]+?).*?x:\s*(\d+).*?y:\s*(\d+).*?width:\s*(\d+).*?height:\s*(\d+)/gi,
      // Pattern: "located at (x, y) with dimensions (w, h)"
      /([^:\n]+?).*?(?:located|positioned).*?[\(\s](\d+),?\s*(\d+)[\)\s].*?(?:dimensions|size).*?[\(\s](\d+),?\s*(\d+)[\)\s]/gi,
      // Pattern: "top-left (x1,y1) bottom-right (x2,y2)"
      /([^:\n]+?).*?(?:top-?left|upper-?left).*?[\(\s](\d+),?\s*(\d+)[\)\s].*?(?:bottom-?right|lower-?right).*?[\(\s](\d+),?\s*(\d+)[\)\s]/gi
    ];

    patterns.forEach((pattern, patternIndex) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const label = match[1].trim();
        let x, y, width, height;
        
        if (patternIndex === 3) {
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
          console.log(`Found object: ${label} at (${x}, ${y}) with size ${width}x${height}`);
        }
      }
    });

    // If no coordinates found, create some default crop areas based on object mentions
    if (areas.length === 0 && text && imageRef.current) {
      console.log('No coordinates found, creating default areas');
      const lines = text.split('\n').filter(line => line.trim());
      const imgWidth = imageRef.current.width;
      const imgHeight = imageRef.current.height;
      
      lines.slice(0, 6).forEach((line, index) => {
        // Extract object name from line
        const objectMatch = line.match(/(?:Object:|^)([^-:]+?)(?:\s*-|\s*:|$)/);
        const objectName = objectMatch ? objectMatch[1].trim() : `Object ${index + 1}`;
        
        // Create grid-based areas
        const cols = 3;
        const rows = 2;
        const cellWidth = imgWidth / cols;
        const cellHeight = imgHeight / rows;
        const col = index % cols;
        const row = Math.floor(index / cols);
        
        const x = col * cellWidth + cellWidth * 0.1;
        const y = row * cellHeight + cellHeight * 0.1;
        const w = cellWidth * 0.8;
        const h = cellHeight * 0.8;
        
        areas.push({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(w),
          height: Math.round(h),
          label: objectName
        });
      });
    }

    console.log(`Parsed ${areas.length} areas for cropping`);
    return areas;
  }, []);

  // Auto-crop when detection results change
  useEffect(() => {
    if (detectionResult && imageRef.current && detectionResult.trim() && !detectionResult.includes('Analysis failed')) {
      console.log('Starting auto-crop process');
      const areas = parseDetectionResults(detectionResult);
      setDetectedAreas(areas);
      
      if (areas.length > 0) {
        // Small delay to ensure image is loaded
        setTimeout(() => {
          autoCropDetectedObjects(areas);
        }, 500);
      }
    }
  }, [detectionResult, parseDetectionResults]);

  const autoCropDetectedObjects = useCallback(async (areas: CropData[]) => {
    if (!imageRef.current || !canvasRef.current || areas.length === 0) return;
    
    console.log('Auto-cropping detected objects:', areas);
    setIsProcessing(true);
    const newCroppedImages: Array<{ url: string; label: string }> = [];
    
    for (const area of areas) {
      try {
        const croppedUrl = await cropImageArea(area);
        if (croppedUrl) {
          newCroppedImages.push({
            url: croppedUrl,
            label: area.label || `Object ${newCroppedImages.length + 1}`
          });
          onCropComplete?.(croppedUrl);
        }
      } catch (error) {
        console.error('Error cropping area:', error);
      }
    }
    
    console.log(`Successfully cropped ${newCroppedImages.length} objects`);
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

      console.log('Cropping area:', cropData);

      // Calculate scaling factors between displayed image and natural image
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Apply scaling to crop coordinates
      const scaledX = cropData.x * scaleX;
      const scaledY = cropData.y * scaleY;
      const scaledWidth = cropData.width * scaleX;
      const scaledHeight = cropData.height * scaleY;

      // Set canvas size to the scaled crop size
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      // Draw the cropped portion
      ctx.drawImage(
        image,
        scaledX,
        scaledY,
        scaledWidth,
        scaledHeight,
        0,
        0,
        scaledWidth,
        scaledHeight
      );

      // Convert to blob and create URL
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          console.log('Created cropped image:', cropData.label);
          resolve(croppedUrl);
        } else {
          resolve(null);
        }
      }, 'image/png');
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

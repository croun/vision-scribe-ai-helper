
import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crop, Download } from 'lucide-react';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCropComplete?: (croppedImageUrl: string) => void;
}

export const ImageCropper = ({ imageUrl, onCropComplete }: ImageCropperProps) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentCrop, setCurrentCrop] = useState<CropData | null>(null);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPoint({ x, y });
    setIsSelecting(true);
    setCurrentCrop({ x, y, width: 0, height: 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!isSelecting || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentCrop({
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
    });
  }, [isSelecting, startPoint]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
  }, []);

  const cropImage = useCallback(() => {
    if (!currentCrop || !imageRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;
    
    if (!ctx) return;

    // Calculate scaling factors
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas size to crop size
    canvas.width = currentCrop.width * scaleX;
    canvas.height = currentCrop.height * scaleY;

    // Draw cropped portion
    ctx.drawImage(
      image,
      currentCrop.x * scaleX,
      currentCrop.y * scaleY,
      currentCrop.width * scaleX,
      currentCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    // Convert to blob and create URL
    canvas.toBlob((blob) => {
      if (blob) {
        const croppedUrl = URL.createObjectURL(blob);
        setCroppedImages(prev => [...prev, croppedUrl]);
        onCropComplete?.(croppedUrl);
      }
    });

    setCurrentCrop(null);
  }, [currentCrop, onCropComplete]);

  const downloadCroppedImage = useCallback((imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `cropped-object-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const clearCroppedImages = useCallback(() => {
    croppedImages.forEach(url => URL.revokeObjectURL(url));
    setCroppedImages([]);
  }, [croppedImages]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Image Cropper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative inline-block border-2 border-gray-200 rounded-lg overflow-hidden">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop source"
                className="max-w-full h-auto cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                draggable={false}
              />
              
              {currentCrop && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                  style={{
                    left: currentCrop.x,
                    top: currentCrop.y,
                    width: currentCrop.width,
                    height: currentCrop.height,
                  }}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={cropImage}
                disabled={!currentCrop || currentCrop.width < 10 || currentCrop.height < 10}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Crop className="h-4 w-4 mr-2" />
                Crop Selection
              </Button>
              
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
              Click and drag on the image to select an area to crop.
            </p>
          </div>
        </CardContent>
      </Card>

      {croppedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cropped Objects ({croppedImages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {croppedImages.map((imageUrl, index) => (
                <div key={index} className="space-y-2">
                  <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img 
                      src={imageUrl} 
                      alt={`Cropped object ${index + 1}`}
                      className="w-full h-auto max-h-32 object-contain rounded"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => downloadCroppedImage(imageUrl, index)}
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

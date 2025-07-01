import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crop, Download, RotateCcw, Sparkles, Plus } from 'lucide-react';
import { ImageEnhancer } from './ImageEnhancer';

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
  const [croppedImages, setCroppedImages] = useState<Array<{ url: string; label: string; id: string }>>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<CropData | null>(null);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedImageForEnhancement, setSelectedImageForEnhancement] = useState<{ url: string; label: string } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getImageCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!imageRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const rect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return;
    
    const coords = getImageCoordinates(e.clientX, e.clientY);
    setSelectionStart(coords);
    setIsSelecting(true);
    setCurrentSelection({ x: coords.x, y: coords.y, width: 0, height: 0 });
  }, [getImageCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !imageRef.current) return;
    
    const coords = getImageCoordinates(e.clientX, e.clientY);
    const width = coords.x - selectionStart.x;
    const height = coords.y - selectionStart.y;
    
    setCurrentSelection({
      x: width < 0 ? coords.x : selectionStart.x,
      y: height < 0 ? coords.y : selectionStart.y,
      width: Math.abs(width),
      height: Math.abs(height)
    });
  }, [isSelecting, selectionStart, getImageCoordinates]);

  const handleMouseUp = useCallback(() => {
    if (currentSelection && currentSelection.width > 10 && currentSelection.height > 10) {
      // Keep the selection for cropping
    } else {
      setCurrentSelection(null);
    }
    setIsSelecting(false);
    setSelectionStart(null);
  }, [currentSelection]);

  const cropSelectedArea = useCallback(async () => {
    if (!currentSelection || !imageRef.current || !canvasRef.current) return;
    
    const croppedUrl = await cropImageArea(currentSelection);
    if (croppedUrl) {
      const id = `crop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newCroppedImage = {
        url: croppedUrl,
        label: `Cropped Object ${croppedImages.length + 1}`,
        id
      };
      
      setCroppedImages(prev => [...prev, newCroppedImage]);
      onCropComplete?.(croppedUrl);
      setCurrentSelection(null);
    }
  }, [currentSelection, croppedImages.length, onCropComplete]);

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
    setCurrentSelection(null);
  }, [croppedImages]);

  const clearCurrentSelection = useCallback(() => {
    setCurrentSelection(null);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Manual Object Cropper
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              ref={containerRef}
              className="relative inline-block border-2 border-gray-200 rounded-lg overflow-hidden cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Source image for cropping"
                className="max-w-full h-auto select-none"
                draggable={false}
              />
              
              {/* Show current selection */}
              {currentSelection && currentSelection.width > 0 && currentSelection.height > 0 && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                  style={{
                    left: currentSelection.x,
                    top: currentSelection.y,
                    width: currentSelection.width,
                    height: currentSelection.height,
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                    Selection
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {currentSelection && currentSelection.width > 10 && currentSelection.height > 10 && (
                <>
                  <Button 
                    onClick={cropSelectedArea}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Crop Selected Area
                  </Button>
                  <Button 
                    onClick={clearCurrentSelection}
                    variant="outline"
                    size="sm"
                  >
                    Clear Selection
                  </Button>
                </>
              )}
              
              {croppedImages.length > 0 && (
                <Button 
                  onClick={clearCroppedImages}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear All Crops
                </Button>
              )}
            </div>

            <p className="text-sm text-gray-600">
              Click and drag on the image to select areas you want to crop. 
              You can create multiple crops from the same image.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {croppedImages.map((item, index) => (
                <div key={item.id} className="space-y-2">
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
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => downloadCroppedImage(item.url, item.label, index)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedImageForEnhancement({ url: item.url, label: item.label })}
                    >
                      <Sparkles className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedImageForEnhancement && (
        <ImageEnhancer
          imageUrl={selectedImageForEnhancement.url}
          imageName={selectedImageForEnhancement.label}
          detectionResult={detectionResult}
          onEnhancedImage={(enhancedUrl) => {
            console.log('Enhanced image created:', enhancedUrl);
          }}
        />
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

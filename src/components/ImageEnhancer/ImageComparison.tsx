
import { ShoppingBag } from 'lucide-react';

interface ImageComparisonProps {
  originalUrl: string;
  enhancedUrl: string;
}

export const ImageComparison = ({ originalUrl, enhancedUrl }: ImageComparisonProps) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="relative">
          <img 
            src={originalUrl} 
            alt="Original" 
            className="w-full h-32 object-contain border-2 border-gray-200 rounded-lg bg-gray-50"
          />
          <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-1 text-xs rounded font-medium">
            BEFORE
          </div>
        </div>
        <p className="text-sm text-center text-gray-600 font-medium">Original Cropped Image</p>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <div className="w-full h-32 border-2 border-green-200 rounded-lg bg-white flex items-center justify-center">
            {enhancedUrl ? (
              <>
                <img 
                  src={enhancedUrl} 
                  alt="Shopify Ready" 
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 text-xs rounded font-medium">
                  AFTER
                </div>
              </>
            ) : (
              <div className="text-center">
                <ShoppingBag className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-green-600 font-medium">Professional Result</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-center text-green-600 font-medium">Shopify-Ready Product</p>
      </div>
    </div>
  );
};

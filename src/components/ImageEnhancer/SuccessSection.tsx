
import { Button } from '@/components/ui/button';
import { Download, Package } from 'lucide-react';

interface SuccessSectionProps {
  onDownload: () => void;
}

export const SuccessSection = ({ onDownload }: SuccessSectionProps) => {
  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-green-700">
        <Package className="h-5 w-5" />
        <span className="font-semibold">Professional Enhancement Complete!</span>
      </div>
      
      <Button 
        onClick={onDownload}
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        <Download className="h-4 w-4 mr-2" />
        Download Shopify-Ready Image
      </Button>
      
      <div className="text-sm text-green-700 space-y-2">
        <p className="font-semibold">✅ Professional Features Applied:</p>
        <ul className="space-y-1 pl-4">
          <li>• Pure white background perfect for Shopify</li>
          <li>• Enhanced brightness and contrast for appeal</li>
          <li>• Sharpened edges for crystal clear detail</li>
          <li>• Improved color saturation and accuracy</li>
          <li>• Professional shadows and lighting effects</li>
          <li>• Perfect square format for consistent display</li>
          <li>• Optimized file size for fast loading</li>
        </ul>
      </div>
    </div>
  );
};

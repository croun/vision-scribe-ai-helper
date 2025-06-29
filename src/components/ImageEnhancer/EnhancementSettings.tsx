
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BackgroundOption {
  value: string;
  label: string;
  color: string;
  description: string;
}

interface SizeOption {
  value: string;
  label: string;
  recommended?: boolean;
  description: string;
}

interface EnhancementSettingsProps {
  backgroundType: string;
  setBackgroundType: (type: string) => void;
  imageSize: string;
  setImageSize: (size: string) => void;
  backgroundOptions: BackgroundOption[];
  sizeOptions: SizeOption[];
}

export const EnhancementSettings = ({
  backgroundType,
  setBackgroundType,
  imageSize,
  setImageSize,
  backgroundOptions,
  sizeOptions
}: EnhancementSettingsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Professional Background</Label>
        <Select value={backgroundType} onValueChange={setBackgroundType}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {backgroundOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ background: option.color }}
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold text-gray-700">Shopify Image Size</Label>
        <Select value={imageSize} onValueChange={setImageSize}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                  {option.recommended && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                      BEST
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

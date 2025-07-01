
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Wand } from 'lucide-react';

interface OpenAIKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
}

export const OpenAIKeyInput = ({ apiKey, setApiKey, onEnhance, isEnhancing }: OpenAIKeyInputProps) => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
          <Wand className="h-4 w-4" />
          Conservative AI Enhancement (DALL-E 2)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="openai-key" className="text-sm">OpenAI API Key</Label>
          <input
            id="openai-key"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-3 py-2 border border-orange-200 rounded-md text-sm font-mono"
          />
        </div>
        <Button 
          onClick={onEnhance}
          disabled={!apiKey.trim() || isEnhancing}
          size="sm"
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {isEnhancing ? (
            <>
              <Wand className="h-3 w-3 mr-2 animate-pulse" />
              Enhancing (Preserving Details)...
            </>
          ) : (
            <>
              <Wand className="h-3 w-3 mr-2" />
              Enhance (Keep Original Look)
            </>
          )}
        </Button>
        <p className="text-xs text-orange-600">
          Uses DALL-E 2 to subtly enhance your image while preserving all original details and characteristics.
        </p>
      </CardContent>
    </Card>
  );
};

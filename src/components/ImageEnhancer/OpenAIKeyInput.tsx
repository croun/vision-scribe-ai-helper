
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface OpenAIKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
}

export const OpenAIKeyInput = ({ apiKey, setApiKey, onEnhance, isEnhancing }: OpenAIKeyInputProps) => {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-green-700">
          <Search className="h-4 w-4" />
          AI Product Search & Replace
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
            className="w-full px-3 py-2 border border-green-200 rounded-md text-sm font-mono"
          />
        </div>
        <Button 
          onClick={onEnhance}
          disabled={!apiKey.trim() || isEnhancing}
          size="sm"
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isEnhancing ? (
            <>
              <Search className="h-3 w-3 mr-2 animate-pulse" />
              Searching for Similar Product...
            </>
          ) : (
            <>
              <Search className="h-3 w-3 mr-2" />
              Find Similar Product Online
            </>
          )}
        </Button>
        <p className="text-xs text-green-600">
          Uses AI to identify your product and find a similar high-quality image online to replace it.
        </p>
      </CardContent>
    </Card>
  );
};

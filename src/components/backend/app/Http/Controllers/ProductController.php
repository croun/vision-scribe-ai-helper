<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProductController extends Controller
{
    // Analyze via direct image upload
    public function analyze(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:10240', // 10MB max
        ]);

        try {
            $image = $request->file('image');
            $imageBase64 = base64_encode(file_get_contents($image->path()));
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4-vision-preview',
                'messages' => [[
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "Analyze this product image and provide:\n1. Product name/description\n2. Category\n3. Key visual characteristics\n4. Brand or style if visible\n\nFormat your response clearly."
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => "data:image/jpeg;base64,{$imageBase64}"
                            ]
                        ]
                    ]
                ]],
                'max_tokens' => 1000
            ]);

            if ($response->failed()) {
                Log::error('OpenAI API error', ['response' => $response->json()]);
                return response()->json(['error' => 'Failed to analyze image'], 500);
            }

            return response()->json([
                'analysis' => $response->json()['choices'][0]['message']['content']
            ]);

        } catch (\Exception $e) {
            Log::error('Product analysis error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Analyze via image URL from frontend
    public function analyzeFromUrl(Request $request)
    {
        $request->validate([
            'image_url' => 'required|url'
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4-vision-preview',
                'messages' => [[
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "Analyze this product image and provide:\n1. Product name/description\n2. Category\n3. Key visual characteristics\n4. Brand or style if visible\n\nFormat your response clearly."
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => $request->image_url
                            ]
                        ]
                    ]
                ]],
                'max_tokens' => 1000
            ]);

            if ($response->failed()) {
                Log::error('OpenAI API (URL) error', ['response' => $response->json()]);
                return response()->json(['error' => 'Failed to analyze image URL'], 500);
            }

            return response()->json([
                'analysis' => $response->json()['choices'][0]['message']['content']
            ]);
        } catch (\Exception $e) {
            Log::error('Image URL analysis error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Enhance image via file upload
    public function enhance(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:10240',
            'prompt' => 'sometimes|string|max:1000',
        ]);

        try {
            $image = $request->file('image');
            $imageBase64 = base64_encode(file_get_contents($image->path()));

            // Step 1: Describe the image
            $analysisResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4-vision-preview',
                'messages' => [[
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "Describe this product image in detail for generating an enhanced version."
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => "data:image/jpeg;base64,{$imageBase64}"
                            ]
                        ]
                    ]
                ]],
                'max_tokens' => 500
            ]);

            if ($analysisResponse->failed()) {
                throw new \Exception('Failed to analyze image for enhancement');
            }

            $description = $analysisResponse->json()['choices'][0]['message']['content'];
            $userPrompt = $request->input('prompt', '');

            // Step 2: Generate enhanced image
            $enhanceResponse = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/images/generations', [
                'model' => 'dall-e-3',
                'prompt' => $userPrompt ?: "Create a professional e-commerce product image based on this description: {$description}",
                'n' => 1,
                'size' => '1024x1024',
                'quality' => 'hd'
            ]);

            if ($enhanceResponse->failed()) {
                throw new \Exception('Failed to generate enhanced image');
            }

            return response()->json([
                'enhanced_url' => $enhanceResponse->json()['data'][0]['url'],
                'description' => $description
            ]);

        } catch (\Exception $e) {
            Log::error('Product enhancement error', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ✅ Enhance using image URL
    public function enhanceFromUrl(Request $request)
    {
        $request->validate([
            'image_url' => 'required|url',
            'prompt' => 'nullable|string|max:1000'
        ]);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . config('services.openai.key'),
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/images/generations', [
                'model' => 'dall-e-3',
                'prompt' => $request->input('prompt', 'Create a professional product image'),
                'n' => 1,
                'size' => '1024x1024'
            ]);

            return $response->json();
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}

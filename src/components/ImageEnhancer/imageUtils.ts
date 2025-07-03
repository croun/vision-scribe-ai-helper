import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_IMAGE_DIMENSION = 1024;

// Background removal functionality
function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
      throw new Error('Invalid segmentation result');
    }
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Apply inverted mask to alpha channel
    for (let i = 0; i < result[0].mask.data.length; i++) {
      // Invert the mask value (1 - value) to keep the subject instead of the background
      const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
      data[i * 4 + 3] = alpha;
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const base64 = canvas.toDataURL('image/png', 1.0);
      resolve(base64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

export const reimagineProductImage = async (imageUrl: string, apiKey: string): Promise<string | null> => {
  try {
    console.log('Reimagining product image for customer appeal...');
    
    // Convert image to base64 for analysis
    const base64Image = await convertImageToBase64(imageUrl);
    
    // Use OpenAI Vision to analyze the product and then generate a reimagined version
    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and describe what product this is in detail for generating a more customer-friendly, sales-oriented version. Focus on the product type, key features, and how it should be presented to appeal to customers.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 300
      }),
    });

    if (!analysisResponse.ok) {
      const errorData = await analysisResponse.json();
      console.error('OpenAI Analysis error:', errorData);
      throw new Error(errorData.error?.message || `Analysis failed with status ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const productDescription = analysisData.choices[0]?.message?.content;
    
    if (!productDescription) {
      throw new Error('No product description received from analysis');
    }

    console.log('Product analysis:', productDescription);

    // Generate a reimagined customer-friendly product image
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `You are an expert image enhancer and product photographer.
Carefully enhance the following image with the following strict instructions:

[original_image]
${productDescription}

[enhancement_instructions]

Preserve the product exactly — its shape, color, shadows, and position must not be altered or stylized.

Remove the current background and replace it with a clean, studio-quality white background.

Adjust lighting and shadows to make the product look professionally lit — soft shadows under the product, light source from top-left.

Improve image clarity — enhance sharpness, contrast, and color balance to bring out the product's natural colors and materials.

Add slight soft reflections below the product on the white surface if appropriate, to simulate a real product studio setup.

Avoid artificial textures, props, logos, or any object additions.`,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural'
      }),
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('OpenAI Image Generation error:', errorData);
      throw new Error(errorData.error?.message || `Image generation failed with status ${imageResponse.status}`);
    }

    const imageData = await imageResponse.json();
    const reimaginedImageUrl = imageData.data[0]?.url;
    
    if (reimaginedImageUrl) {
      console.log('Generated reimagined product image:', reimaginedImageUrl);
      return reimaginedImageUrl;
    } else {
      throw new Error('No image URL received from reimagining');
    }

  } catch (error) {
    console.error('Product reimagining error:', error);
    return null;
  }
};

// Improved auto-crop function with better accuracy
export const autoCropProduct = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;
      
      // More accurate edge detection with better threshold
      const bounds = findProductBounds(data, img.width, img.height);
      
      if (bounds) {
        // Add padding around the detected object (8% instead of 10% for tighter crop)
        const padding = Math.min(bounds.width, bounds.height) * 0.08;
        const cropX = Math.max(0, bounds.minX - padding);
        const cropY = Math.max(0, bounds.minY - padding);
        const cropWidth = Math.min(img.width - cropX, bounds.width + padding * 2);
        const cropHeight = Math.min(img.height - cropY, bounds.height + padding * 2);
        
        // Create cropped canvas
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        
        if (croppedCtx) {
          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;
          
          croppedCtx.drawImage(
            img,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );
          
          croppedCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create cropped blob'));
            }
          }, 'image/png', 1.0);
        } else {
          reject(new Error('Could not get cropped canvas context'));
        }
      } else {
        // If no bounds detected, return original image
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 1.0);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
};

// More accurate product bounds detection
const findProductBounds = (data: Uint8ClampedArray, width: number, height: number) => {
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let hasContent = false;
  
  // Multi-pass edge detection for better accuracy
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Improved content detection with better thresholds
      const isBackground = (
        // Pure white or very light backgrounds
        (r > 240 && g > 240 && b > 240) ||
        // Transparent pixels
        a < 50 ||
        // Very light gray backgrounds
        (Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && r > 230)
      );
      
      // Additional edge detection using local contrast
      const hasLocalContrast = checkLocalContrast(data, x, y, width, height);
      
      if (!isBackground || hasLocalContrast) {
        hasContent = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  if (!hasContent || maxX <= minX || maxY <= minY) {
    return null;
  }
  
  return {
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

// Check local contrast for better edge detection
const checkLocalContrast = (data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean => {
  const radius = 2;
  let contrastSum = 0;
  let pixelCount = 0;
  
  const centerI = (y * width + x) * 4;
  const centerR = data[centerI];
  const centerG = data[centerI + 1];
  const centerB = data[centerI + 2];
  
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const i = (ny * width + nx) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const contrast = Math.abs(r - centerR) + Math.abs(g - centerG) + Math.abs(b - centerB);
        contrastSum += contrast;
        pixelCount++;
      }
    }
  }
  
  const avgContrast = contrastSum / pixelCount;
  return avgContrast > 25; // Threshold for significant contrast
};

export const enhanceImageWithCanvas = async (
  imageUrl: string,
  backgroundType: string,
  imageSize: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      const [width, height] = imageSize.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Clear canvas with professional background
        ctx.clearRect(0, 0, width, height);
        
        // Set up realistic background
        setupRealisticBackground(ctx, width, height, backgroundType);
        
        // Calculate optimal product sizing and positioning
        const productScale = calculateOptimalScale(img.width, img.height, width, height);
        const scaledWidth = img.width * productScale;
        const scaledHeight = img.height * productScale;
        
        // Perfect center positioning
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        // Apply subtle realistic lighting effects
        if (backgroundType !== 'transparent') {
          applyRealisticLighting(ctx, x, y, scaledWidth, scaledHeight, backgroundType);
        }
        
        // Draw the product with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Apply realistic enhancements (toned down)
        applyRealisticEnhancements(ctx, width, height, backgroundType);
        
        // Convert to optimized format
        const format = backgroundType === 'transparent' ? 'image/png' : 'image/jpeg';
        const quality = backgroundType === 'transparent' ? 1.0 : 0.95;
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, format, quality);
      }
    };
    
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onerror = () => reject(new Error('Failed to load image'));
  });
};

const calculateOptimalScale = (imgWidth: number, imgHeight: number, canvasWidth: number, canvasHeight: number): number => {
  // Calculate scale to fit within 80% of canvas (more conservative for better framing)
  const maxScale = 0.80;
  const scaleX = (canvasWidth * maxScale) / imgWidth;
  const scaleY = (canvasHeight * maxScale) / imgHeight;
  return Math.min(scaleX, scaleY);
};

const setupRealisticBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, backgroundType: string) => {
  ctx.save();
  
  switch (backgroundType) {
    case 'transparent':
      // Keep transparent for PNG
      break;
      
    case 'studio-white':
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'soft-studio':
      ctx.fillStyle = '#FEFEFE';
      ctx.fillRect(0, 0, width, height);
      // Very subtle vignette
      const vignette = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.8);
      vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vignette.addColorStop(1, 'rgba(248, 248, 248, 0.15)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'premium-gradient':
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#fcfcfc');
      gradient.addColorStop(1, '#f9f9f9');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'light-neutral':
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, width, height);
      break;
      
    default:
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
  }
  
  ctx.restore();
};

const applyRealisticLighting = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, backgroundType: string) => {
  ctx.save();
  
  // Subtle, realistic drop shadow
  const shadowLayers = [
    { blur: 15, offsetX: 0, offsetY: 8, opacity: 0.06, color: 'rgba(0, 0, 0, 0.06)' },
    { blur: 8, offsetX: 0, offsetY: 4, opacity: 0.04, color: 'rgba(0, 0, 0, 0.04)' }
  ];
  
  shadowLayers.forEach(shadow => {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    ctx.globalAlpha = shadow.opacity;
    
    // Create shadow shape
    ctx.fillStyle = shadow.color;
    ctx.fillRect(x, y, width, height);
  });
  
  // Reset shadow settings
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.globalAlpha = 1;
  
  ctx.restore();
};

const applyRealisticEnhancements = (ctx: CanvasRenderingContext2D, width: number, height: number, backgroundType: string) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Subtle, realistic color correction
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a === 0) continue;
    
    // Very subtle realistic enhancements
    const brightness = 1.02; // Much more subtle
    const contrast = 1.05;   // Reduced contrast
    const saturation = 1.02; // Minimal saturation boost
    
    // Apply subtle brightness
    let newR = Math.min(255, r * brightness);
    let newG = Math.min(255, g * brightness);
    let newB = Math.min(255, b * brightness);
    
    // Apply subtle contrast
    newR = Math.min(255, Math.max(0, ((newR - 128) * contrast) + 128));
    newG = Math.min(255, Math.max(0, ((newG - 128) * contrast) + 128));
    newB = Math.min(255, Math.max(0, ((newB - 128) * contrast) + 128));
    
    // Apply minimal saturation enhancement
    const gray = 0.299 * newR + 0.587 * newG + 0.114 * newB;
    newR = Math.min(255, Math.max(0, gray + saturation * (newR - gray)));
    newG = Math.min(255, Math.max(0, gray + saturation * (newG - gray)));
    newB = Math.min(255, Math.max(0, gray + saturation * (newB - gray)));
    
    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Apply very subtle sharpening
  applySubtleSharpening(ctx, width, height);
};

const applySubtleSharpening = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const originalData = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  
  // Subtle sharpening kernel
  const kernel = [
    0, -0.2, 0,
    -0.2, 1.8, -0.2,
    0, -0.2, 0
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += originalData[pixel] * kernel[kernelIndex];
          }
        }
        
        const currentPixel = (y * width + x) * 4 + c;
        data[currentPixel] = Math.max(0, Math.min(255, sum));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

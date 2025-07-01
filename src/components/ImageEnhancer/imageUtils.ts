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

export const searchSimilarProduct = async (productDescription: string, apiKey: string): Promise<string | null> => {
  try {
    console.log('Searching for product:', productDescription);
    
    // Use OpenAI to generate a professional product image based on the description
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-2',
        prompt: `Professional product photography of ${productDescription}, clean white background, high quality, commercial product photo, studio lighting, 4K resolution, sharp focus, product catalog style`,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI Image Generation error:', errorData);
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;
    
    if (imageUrl) {
      console.log('Generated product image:', imageUrl);
      return imageUrl;
    } else {
      throw new Error('No image URL received from OpenAI');
    }

  } catch (error) {
    console.error('Product search error:', error);
    return null;
  }
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
        // Clear canvas first
        ctx.clearRect(0, 0, width, height);
        
        // Set up professional background
        setupBackground(ctx, width, height, backgroundType);
        
        // Calculate product sizing (80% for better visual impact with shadow space)
        const scale = Math.min(width / img.width, height / img.height) * 0.8;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the product perfectly
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        // Apply studio shadow effect (except for transparent)
        if (backgroundType !== 'transparent') {
          applyStudioShadow(ctx, x, y, scaledWidth, scaledHeight);
        }
        
        // Draw the product image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Apply professional image enhancements
        applyImageEnhancements(ctx, width, height);
        
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

const setupBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, backgroundType: string) => {
  ctx.save();
  
  switch (backgroundType) {
    case 'transparent':
      // Keep transparent
      break;
      
    case 'professional-white':
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'soft-white':
      ctx.fillStyle = '#FEFEFE';
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'light-gray':
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'gradient-white':
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#fafafa');
      gradient.addColorStop(1, '#f5f5f5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;
      
    default:
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
  }
  
  ctx.restore();
};

const applyStudioShadow = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
  ctx.save();
  
  // Create multiple shadow layers for realistic studio lighting
  const shadows = [
    { blur: 30, offsetY: 20, opacity: 0.15, color: 'rgba(0, 0, 0, 0.15)' },
    { blur: 15, offsetY: 10, opacity: 0.1, color: 'rgba(0, 0, 0, 0.1)' },
    { blur: 5, offsetY: 5, opacity: 0.05, color: 'rgba(0, 0, 0, 0.05)' }
  ];
  
  shadows.forEach(shadow => {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shadow.offsetY;
    
    // Draw invisible rectangle to create shadow
    ctx.globalAlpha = shadow.opacity;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
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

const applyImageEnhancements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Professional color enhancement
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Skip transparent pixels
    if (data[i + 3] === 0) continue;
    
    // Enhanced brightness and contrast for professional look
    const brightness = 1.1;
    const contrast = 1.15;
    
    // Apply brightness
    let newR = Math.min(255, r * brightness);
    let newG = Math.min(255, g * brightness);
    let newB = Math.min(255, b * brightness);
    
    // Apply contrast
    newR = Math.min(255, Math.max(0, ((newR - 128) * contrast) + 128));
    newG = Math.min(255, Math.max(0, ((newG - 128) * contrast) + 128));
    newB = Math.min(255, Math.max(0, ((newB - 128) * contrast) + 128));
    
    // Subtle saturation boost for product appeal
    const max = Math.max(newR, newG, newB);
    const min = Math.min(newR, newG, newB);
    
    if (max !== min) {
      const saturationBoost = 1.08;
      const center = (max + min) / 2;
      
      newR = Math.min(255, Math.max(0, center + (newR - center) * saturationBoost));
      newG = Math.min(255, Math.max(0, center + (newG - center) * saturationBoost));
      newB = Math.min(255, Math.max(0, center + (newB - center) * saturationBoost));
    }
    
    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Apply subtle sharpening for crisp product details
  applySharpening(ctx, width, height);
};

const applySharpening = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const originalData = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  
  // Subtle sharpening kernel
  const kernel = [
    0, -0.5, 0,
    -0.5, 3, -0.5,
    0, -0.5, 0
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

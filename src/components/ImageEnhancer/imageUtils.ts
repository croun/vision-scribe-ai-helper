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
        // Clear canvas with professional background
        ctx.clearRect(0, 0, width, height);
        
        // Set up professional background
        setupProfessionalBackground(ctx, width, height, backgroundType);
        
        // Calculate optimal product sizing and positioning
        const productScale = calculateOptimalScale(img.width, img.height, width, height);
        const scaledWidth = img.width * productScale;
        const scaledHeight = img.height * productScale;
        
        // Perfect center positioning
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        // Apply professional lighting effects
        if (backgroundType !== 'transparent') {
          applyProfessionalLighting(ctx, x, y, scaledWidth, scaledHeight, backgroundType);
        }
        
        // Draw the product with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Apply professional enhancements
        applyProfessionalEnhancements(ctx, width, height, backgroundType);
        
        // Convert to optimized format
        const format = backgroundType === 'transparent' ? 'image/png' : 'image/jpeg';
        const quality = backgroundType === 'transparent' ? 1.0 : 0.98;
        
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
  // Calculate scale to fit within 85% of canvas (leaving room for shadows and padding)
  const maxScale = 0.85;
  const scaleX = (canvasWidth * maxScale) / imgWidth;
  const scaleY = (canvasHeight * maxScale) / imgHeight;
  return Math.min(scaleX, scaleY);
};

const setupProfessionalBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, backgroundType: string) => {
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
      ctx.fillStyle = '#FAFAFA';
      ctx.fillRect(0, 0, width, height);
      // Add subtle vignette
      const vignette = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.5);
      vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vignette.addColorStop(1, 'rgba(250, 250, 250, 0.3)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'premium-gradient':
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.5, '#f8f9fa');
      gradient.addColorStop(1, '#f1f3f4');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      break;
      
    case 'light-neutral':
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(0, 0, width, height);
      // Add subtle texture
      for (let i = 0; i < width; i += 4) {
        for (let j = 0; j < height; j += 4) {
          if (Math.random() > 0.95) {
            ctx.fillStyle = 'rgba(240, 240, 240, 0.5)';
            ctx.fillRect(i, j, 1, 1);
          }
        }
      }
      break;
      
    default:
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
  }
  
  ctx.restore();
};

const applyProfessionalLighting = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, backgroundType: string) => {
  ctx.save();
  
  // Professional drop shadow system
  const shadowLayers = [
    { blur: 25, offsetX: 0, offsetY: 15, opacity: 0.12, color: 'rgba(0, 0, 0, 0.12)' },
    { blur: 15, offsetX: 0, offsetY: 8, opacity: 0.08, color: 'rgba(0, 0, 0, 0.08)' },
    { blur: 8, offsetX: 0, offsetY: 4, opacity: 0.06, color: 'rgba(0, 0, 0, 0.06)' }
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
  
  // Add subtle reflection for premium backgrounds
  if (backgroundType === 'premium-gradient' || backgroundType === 'studio-white') {
    const reflectionGradient = ctx.createLinearGradient(x, y + height, x, y + height + 30);
    reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(x, y + height, width, 30);
  }
  
  ctx.restore();
};

const applyProfessionalEnhancements = (ctx: CanvasRenderingContext2D, width: number, height: number, backgroundType: string) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Enhanced color correction for professional product photography
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Skip transparent pixels
    if (a === 0) continue;
    
    // Professional color enhancement
    const brightness = 1.08;
    const contrast = 1.12;
    const saturation = 1.06;
    
    // Apply brightness
    let newR = Math.min(255, r * brightness);
    let newG = Math.min(255, g * brightness);
    let newB = Math.min(255, b * brightness);
    
    // Apply contrast
    newR = Math.min(255, Math.max(0, ((newR - 128) * contrast) + 128));
    newG = Math.min(255, Math.max(0, ((newG - 128) * contrast) + 128));
    newB = Math.min(255, Math.max(0, ((newB - 128) * contrast) + 128));
    
    // Apply saturation enhancement
    const gray = 0.299 * newR + 0.587 * newG + 0.114 * newB;
    newR = Math.min(255, Math.max(0, gray + saturation * (newR - gray)));
    newG = Math.min(255, Math.max(0, gray + saturation * (newG - gray)));
    newB = Math.min(255, Math.max(0, gray + saturation * (newB - gray)));
    
    // Color temperature adjustment for warmer, more appealing products
    newR = Math.min(255, newR * 1.02);
    newB = Math.min(255, newB * 0.98);
    
    data[i] = newR;
    data[i + 1] = newG;
    data[i + 2] = newB;
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Apply professional sharpening
  applyProfessionalSharpening(ctx, width, height);
  
  // Add subtle highlight enhancement
  if (backgroundType !== 'transparent') {
    addHighlightEnhancement(ctx, width, height);
  }
};

const applyProfessionalSharpening = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const originalData = new Uint8ClampedArray(imageData.data);
  const data = imageData.data;
  
  // Professional sharpening kernel
  const kernel = [
    0, -0.4, 0,
    -0.4, 2.6, -0.4,
    0, -0.4, 0
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

const addHighlightEnhancement = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Add subtle highlight gradient for more professional appearance
  const highlight = ctx.createRadialGradient(width * 0.3, height * 0.2, 0, width * 0.3, height * 0.2, width * 0.8);
  highlight.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  highlight.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
  highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = highlight;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';
};

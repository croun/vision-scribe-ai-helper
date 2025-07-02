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

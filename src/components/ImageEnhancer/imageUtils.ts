
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
        // Professional background setup
        if (backgroundType === 'transparent') {
          ctx.clearRect(0, 0, width, height);
        } else if (backgroundType === 'professional-white') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        } else if (backgroundType === 'soft-white') {
          ctx.fillStyle = '#FEFEFE';
          ctx.fillRect(0, 0, width, height);
        } else if (backgroundType === 'light-gray') {
          ctx.fillStyle = '#F5F5F5';
          ctx.fillRect(0, 0, width, height);
        } else if (backgroundType === 'gradient-white') {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(1, '#f8f9fa');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        
        // Professional product sizing (85% for better visual impact)
        const scale = Math.min(width / img.width, height / img.height) * 0.85;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the product perfectly
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        // Professional shadow effect (except for transparent)
        if (backgroundType !== 'transparent') {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
          ctx.shadowBlur = 25;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 15;
        }
        
        // Draw the enhanced product image
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Advanced image enhancement
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Enhanced brightness and contrast for professional look
          const brightness = 1.15;
          const contrast = 1.2;
          
          // Apply brightness
          data[i] = Math.min(255, data[i] * brightness);     // Red
          data[i + 1] = Math.min(255, data[i + 1] * brightness); // Green  
          data[i + 2] = Math.min(255, data[i + 2] * brightness); // Blue
          
          // Apply contrast
          data[i] = Math.min(255, ((data[i] - 128) * contrast) + 128);
          data[i + 1] = Math.min(255, ((data[i + 1] - 128) * contrast) + 128);
          data[i + 2] = Math.min(255, ((data[i + 2] - 128) * contrast) + 128);
          
          // Enhance saturation slightly
          const max = Math.max(data[i], data[i + 1], data[i + 2]);
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          if (max !== min) {
            const saturationBoost = 1.1;
            const delta = (max - min) * saturationBoost;
            const adjustment = (delta - (max - min)) / 2;
            
            if (data[i] !== max && data[i] !== min) data[i] = Math.max(0, Math.min(255, data[i] - adjustment));
            if (data[i + 1] !== max && data[i + 1] !== min) data[i + 1] = Math.max(0, Math.min(255, data[i + 1] - adjustment));
            if (data[i + 2] !== max && data[i + 2] !== min) data[i + 2] = Math.max(0, Math.min(255, data[i + 2] - adjustment));
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Apply subtle sharpening filter
        const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const sharpenedData = ctx.getImageData(0, 0, width, height);
        const originalData = imageData.data;
        const newData = sharpenedData.data;
        
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            for (let c = 0; c < 3; c++) {
              let sum = 0;
              for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                  const pixel = ((y + ky) * width + (x + kx)) * 4 + c;
                  sum += originalData[pixel] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
                }
              }
              const pixel = (y * width + x) * 4 + c;
              newData[pixel] = Math.max(0, Math.min(255, sum));
            }
          }
        }
        
        ctx.putImageData(sharpenedData, 0, 0);
        
        // Convert to optimized format
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            resolve(url);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, backgroundType === 'transparent' ? 'image/png' : 'image/jpeg', 0.95);
      }
    };
    
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onerror = () => reject(new Error('Failed to load image'));
  });
};

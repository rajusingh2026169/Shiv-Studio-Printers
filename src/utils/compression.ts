import imageCompression from 'browser-image-compression';

/**
 * Get max width based on the storage category
 */
export const getMaxWidthForCategory = (category: string): number => {
  const cat = category.toLowerCase();
  if (cat.includes('mobile')) return 800;
  if (cat.includes('banner') || cat.includes('offer')) return 1200; // Max 1200px for desktop banners
  if (cat.includes('product')) return 900;
  if (cat.includes('gallery')) return 1000;
  if (cat.includes('service')) return 900;
  if (cat.includes('logo') || cat.includes('thumb')) return 600;
  return 1000; // sensible default
};

/**
 * Compresses, resizes and converts an image to WebP format.
 * If compression succeeds, returns the compressed File object.
 */
export const compressAndResizeImage = async (file: File, category: string): Promise<File> => {
  // 11. Prevent uploading files larger than 15 MB
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('File size exceeds the 15 MB limit.');
  }

  const maxWidth = getMaxWidthForCategory(category);

  // Fast Native Canvas Compression (~50-100ms)
  try {
    return await new Promise<File>((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP format with high performance 0.75 quality
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                const compressedFile = new File([blob], `${baseName}.webp`, {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                console.log(`Fast Native Canvas Compression: Original ${(file.size / 1024 / 1024).toFixed(2)}MB -> Compressed ${(compressedFile.size / 1024).toFixed(2)}KB (${width}x${height})`);
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas blob generation returned null'));
              }
            },
            'image/webp',
            0.75
          );
        } catch (canvasErr) {
          reject(canvasErr);
        }
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image file into memory: ' + err));
      };

      img.src = url;
    });
  } catch (nativeErr) {
    console.warn('Fast native canvas compression failed, falling back to browser-image-compression:', nativeErr);
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: maxWidth,
      useWebWorker: false,
      fileType: 'image/webp',
      initialQuality: 0.75,
    };
    const compressedBlob = await imageCompression(file, options);
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    return new File([compressedBlob], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  }
};

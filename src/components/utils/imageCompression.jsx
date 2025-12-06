/**
 * 🚀 ULTRA-AGGRESSIVE Image Compression
 * Target: 90+ Lighthouse Score
 * WebP conversion + Maximum compression
 */

export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        
        // Performance optimizations
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium'; // Changed from 'high' for speed
        
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first (best compression), fallback to JPEG
        canvas.toBlob(
          (webpBlob) => {
            if (webpBlob && webpBlob.size < file.size) {
              // WebP successful and smaller
              const compressedFile = new File([webpBlob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              
              const savingsPercent = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);
              console.log(`✅ WebP: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${savingsPercent}% saved)`);
              
              resolve(compressedFile);
            } else {
              // Fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    const compressedFile = new File([jpegBlob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    
                    const savingsPercent = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);
                    console.log(`✅ JPEG: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB (${savingsPercent}% saved)`);
                    
                    resolve(compressedFile);
                  } else {
                    reject(new Error('Compression failed'));
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function validateImage(file, maxSizeMB = 10) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload only image files');
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Image must be less than ${maxSizeMB}MB`);
  }

  return true;
}

/**
 * 🎯 Preload critical images for LCP optimization
 */
export function preloadImage(src) {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * 📊 Lazy load images with Intersection Observer
 */
export function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before image enters viewport
    });

    return imageObserver;
  }
  return null;
}
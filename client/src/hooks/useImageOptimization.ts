import { useState, useEffect, useCallback } from 'react';

interface ImageFormat {
  webp: boolean;
  avif: boolean;
}

interface OptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  lazy?: boolean;
}

interface UseImageOptimizationResult {
  optimizedSrc: string;
  isLoading: boolean;
  hasError: boolean;
  supportedFormats: ImageFormat;
  preloadImage: (src: string) => Promise<void>;
  generateSrcSet: (src: string, sizes: number[]) => string;
}

/**
 * Custom hook for image optimization
 * Handles format detection, preloading, and responsive image generation
 */
export const useImageOptimization = (
  originalSrc: string,
  options: OptimizationOptions = {}
): UseImageOptimizationResult => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(originalSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<ImageFormat>({
    webp: false,
    avif: false
  });

  // Check browser support for modern image formats
  useEffect(() => {
    const checkFormatSupport = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setSupportedFormats({ webp: false, avif: false });
        return;
      }

      // Check WebP support
      const webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      
      // Check AVIF support
      let avifSupport = false;
      try {
        const avifImage = new Image();
        avifSupport = await new Promise((resolve) => {
          avifImage.onload = () => resolve(true);
          avifImage.onerror = () => resolve(false);
          avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        });
      } catch {
        avifSupport = false;
      }

      setSupportedFormats({
        webp: webpSupport,
        avif: avifSupport as boolean
      });
    };

    checkFormatSupport();
  }, []);

  // Generate optimized image URL based on supported formats and options
  const generateOptimizedUrl = useCallback((src: string, opts: OptimizationOptions) => {
    if (src.includes('.svg')) return src; // SVGs don't need optimization

    let optimized = src;
    const { quality = 80, width, height, format = 'auto' } = opts;

    // Replace extension based on format support
    if (format === 'auto') {
      if (supportedFormats.avif) {
        optimized = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
      } else if (supportedFormats.webp) {
        optimized = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }
    } else if (format === 'webp' && supportedFormats.webp) {
      optimized = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    }

    // Add query parameters for dynamic optimization (if using a CDN/service)
    const params = new URLSearchParams();
    if (quality !== 80) params.append('q', quality.toString());
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());

    if (params.toString()) {
      optimized += `?${params.toString()}`;
    }

    return optimized;
  }, [supportedFormats]);

  // Generate srcset for responsive images
  const generateSrcSet = useCallback((src: string, sizes: number[] = [320, 640, 768, 1024, 1280, 1920]) => {
    return sizes
      .map(size => {
        const optimizedUrl = generateOptimizedUrl(src, { ...options, width: size });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }, [generateOptimizedUrl, options]);

  // Preload image utility
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = generateOptimizedUrl(src, options);
    });
  }, [generateOptimizedUrl, options]);

  // Update optimized source when original source or options change
  useEffect(() => {
    if (!originalSrc) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const optimized = generateOptimizedUrl(originalSrc, options);
    
    // Preload the optimized image
    preloadImage(originalSrc)
      .then(() => {
        setOptimizedSrc(optimized);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
        setOptimizedSrc(originalSrc); // Fallback to original
      });
  }, [originalSrc, options, generateOptimizedUrl, preloadImage]);

  return {
    optimizedSrc,
    isLoading,
    hasError,
    supportedFormats,
    preloadImage,
    generateSrcSet
  };
};

// Utility function to detect image format from URL
export const getImageFormat = (src: string): string => {
  const extension = src.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'svg':
      return 'image/svg+xml';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
};

// Utility function to calculate responsive sizes
export const generateResponsiveSizes = (
  breakpoints: { [key: string]: number } = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }
): string => {
  const entries = Object.entries(breakpoints);
  const sizes = entries
    .map(([name, width], index) => {
      if (index === entries.length - 1) {
        return '100vw'; // Default size for largest breakpoint
      }
      const nextWidth = entries[index + 1][1];
      return `(max-width: ${width}px) ${Math.round((width / nextWidth) * 100)}vw`;
    })
    .reverse();
  
  return sizes.join(', ');
};

export default useImageOptimization; 
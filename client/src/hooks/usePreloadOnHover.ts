import { useCallback } from 'react';

type PreloadableComponent = {
  preload?: () => Promise<any>;
};

/**
 * Hook for preloading components on hover
 */
export function usePreloadOnHover(component: PreloadableComponent) {
  const preload = useCallback(() => {
    if (component && typeof component.preload === 'function') {
      component.preload();
    }
  }, [component]);

  const handleMouseEnter = useCallback(() => {
    // Small delay to avoid unnecessary preloads for quick hovers
    const timeoutId = setTimeout(preload, 100);
    
    return () => clearTimeout(timeoutId);
  }, [preload]);

  return {
    onMouseEnter: handleMouseEnter,
    preload
  };
}

/**
 * Hook for preloading multiple components on hover
 */
export function usePreloadMultipleOnHover(components: PreloadableComponent[]) {
  const preloadAll = useCallback(() => {
    components.forEach(component => {
      if (component && typeof component.preload === 'function') {
        component.preload();
      }
    });
  }, [components]);

  const handleMouseEnter = useCallback(() => {
    const timeoutId = setTimeout(preloadAll, 100);
    
    return () => clearTimeout(timeoutId);
  }, [preloadAll]);

  return {
    onMouseEnter: handleMouseEnter,
    preloadAll
  };
} 
import { lazy, ComponentType } from 'react';

// Type for component factory function
type ComponentFactory<T = {}> = () => Promise<{ default: ComponentType<T> }>;

// Preload cache to store preloaded components
const preloadedComponents = new Map<string, Promise<{ default: ComponentType<any> }>>();

/**
 * Enhanced lazy loading with preloading capability
 */
export function lazyWithPreload<T = {}>(
  componentFactory: ComponentFactory<T>,
  componentName: string
) {
  const LazyComponent = lazy(componentFactory);
  
  // Add preload method to the component
  (LazyComponent as any).preload = () => {
    if (!preloadedComponents.has(componentName)) {
      const preloadPromise = componentFactory();
      preloadedComponents.set(componentName, preloadPromise);
      return preloadPromise;
    }
    return preloadedComponents.get(componentName)!;
  };
  
  return LazyComponent;
}

/**
 * Preload multiple components
 */
export function preloadComponents(componentNames: string[]) {
  componentNames.forEach(name => {
    const component = getComponentByName(name);
    if (component && (component as any).preload) {
      (component as any).preload();
    }
  });
}

/**
 * Get component by name (for internal use)
 */
function getComponentByName(name: string) {
  // This would be populated by the actual components
  // For now, it's a placeholder for the preloading system
  return null;
}

/**
 * Preload critical components when user hovers over navigation
 */
export function preloadOnHover(componentNames: string[]) {
  let timeoutId: NodeJS.Timeout;
  
  return {
    onMouseEnter: () => {
      timeoutId = setTimeout(() => {
        preloadComponents(componentNames);
      }, 100); // Small delay to avoid unnecessary preloads
    },
    onMouseLeave: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };
}

/**
 * Preload components based on user role and common workflows
 */
export function preloadByUserRole(userRole: string | null) {
  const commonComponents = ['DashboardPage', 'UserProfilePage', 'NotificationsPage'];
  
  const roleBasedComponents: { [key: string]: string[] } = {
    ADMIN: [...commonComponents, 'CompaniesPage', 'AnalyticsPage', 'ReportsPage'],
    USER: [...commonComponents, 'ProjectsPage', 'TasksPage', 'MaterialsPage'],
    SUPERADMIN: [...commonComponents, 'CompaniesPage', 'AnalyticsPage', 'ReportsPage', 'ProjectsPage']
  };
  
  if (userRole && roleBasedComponents[userRole]) {
    // Preload after a short delay to not block initial load
    setTimeout(() => {
      preloadComponents(roleBasedComponents[userRole]);
    }, 2000);
  }
}

/**
 * Preload components when the app becomes idle
 */
export function preloadOnIdle(componentNames: string[]) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      preloadComponents(componentNames);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadComponents(componentNames);
    }, 5000);
  }
} 
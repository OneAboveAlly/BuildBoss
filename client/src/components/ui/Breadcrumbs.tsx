import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Breadcrumb navigation item interface
 */
interface BreadcrumbItem {
  /** Display text for the breadcrumb item */
  label: string;
  /** Navigation URL (optional for current page) */
  href?: string;
  /** Whether this is the current active page */
  current?: boolean;
}

/**
 * Breadcrumbs component properties interface
 */
interface BreadcrumbsProps {
  /** Array of breadcrumb navigation items */
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs Component
 * 
 * A navigation component that displays the current page's location within the site hierarchy.
 * Provides clear visual path indicators with proper accessibility support and routing integration.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic breadcrumb navigation
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Office Building', current: true }
 *   ]} 
 * />
 * 
 * // Multi-level navigation
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Companies', href: '/companies' },
 *     { label: 'ABC Construction', href: '/companies/123' },
 *     { label: 'Workers', href: '/companies/123/workers' },
 *     { label: 'John Doe', current: true }
 *   ]} 
 * />
 * 
 * // Simple two-level navigation
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Materials', href: '/materials' },
 *     { label: 'Add New Material', current: true }
 *   ]} 
 * />
 * ```
 * 
 * @param props - Breadcrumbs component props
 * @param props.items - Array of breadcrumb items with labels, links, and current state
 * 
 * @returns Rendered breadcrumb navigation
 * 
 * @features
 * - **React Router Integration**: Uses Link components for client-side navigation
 * - **Accessibility Support**: Proper ARIA labels and semantic HTML structure
 * - **Visual Hierarchy**: Clear separation between levels with arrow indicators
 * - **Current Page Indication**: Special styling for the current active page
 * - **Hover States**: Interactive feedback for clickable breadcrumb items
 * - **Responsive Design**: Works well across different screen sizes
 * 
 * @accessibility
 * - Uses semantic nav element with aria-label="Breadcrumb"
 * - Ordered list structure for proper screen reader navigation
 * - Current page marked with appropriate styling and semantics
 * - Keyboard navigation support through Link components
 * 
 * @version 1.0.0
 * @since 1.0.0
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {/* Separator arrow between breadcrumb items */}
            {index > 0 && (
              <svg
                className="w-4 h-4 text-secondary-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            
            {/* Current page (no link) */}
            {item.current ? (
              <span 
                className="text-sm font-medium text-secondary-500"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : item.href ? (
              /* Navigable breadcrumb item */
              <Link
                to={item.href}
                className="text-sm font-medium text-secondary-700 hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              /* Non-navigable breadcrumb item */
              <span className="text-sm font-medium text-secondary-700">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 
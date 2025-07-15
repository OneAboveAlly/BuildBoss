import React from 'react';

/**
 * Badge component properties interface
 */
interface BadgeProps {
  /** Badge content (text, icons, etc.) */
  children: React.ReactNode;
  /** Visual variant of the badge */
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge Component
 * 
 * A small label component for displaying status, categories, or counts.
 * Provides consistent styling with multiple color variants for different contexts.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic badge
 * <Badge>New</Badge>
 * 
 * // Status badges
 * <Badge variant="success">Completed</Badge>
 * <Badge variant="warning">In Progress</Badge>
 * <Badge variant="danger">Overdue</Badge>
 * 
 * // Count badge
 * <Badge variant="secondary">{unreadCount}</Badge>
 * 
 * // Custom styled badge
 * <Badge className="ml-2" variant="default">
 *   Priority: High
 * </Badge>
 * ```
 * 
 * @param props - Badge component props
 * @param props.children - Content to display in the badge
 * @param props.variant - Color variant ('default' | 'secondary' | 'success' | 'warning' | 'danger')
 * @param props.className - Additional CSS classes to apply
 * 
 * @returns Rendered badge element
 * 
 * @features
 * - **Multiple Variants**: Five color schemes for different semantic meanings
 * - **Flexible Content**: Supports text, numbers, icons, or mixed content
 * - **Consistent Sizing**: Uniform padding and typography across variants
 * - **Accessibility**: Proper contrast ratios and semantic styling
 * 
 * @version 1.0.0
 * @since 1.0.0
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = ''
}) => {
  /** Variant-specific styling classes with proper color contrast */
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    secondary: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
        ${variantClasses[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
}; 
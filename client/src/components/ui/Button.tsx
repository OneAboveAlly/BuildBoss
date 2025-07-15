import React from 'react';

/**
 * Button component properties interface
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'white';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Shows loading spinner and disables interaction */
  loading?: boolean;
  /** Button content */
  children: React.ReactNode;
}

/**
 * Button Component
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * Supports loading state with spinner animation and full accessibility features.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Button>Click me</Button>
 * 
 * // Primary action button
 * <Button variant="primary" size="lg">
 *   Save Changes
 * </Button>
 * 
 * // Danger button with loading state
 * <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
 *   Delete Project
 * </Button>
 * 
 * // Outline button
 * <Button variant="outline" size="sm">
 *   Cancel
 * </Button>
 * ```
 * 
 * @param props - Button component props
 * @param props.variant - Visual style variant ('primary' | 'secondary' | 'danger' | 'outline' | 'white')
 * @param props.size - Button size ('sm' | 'md' | 'lg')
 * @param props.loading - Shows loading spinner when true
 * @param props.disabled - Disables button interaction
 * @param props.children - Button content (text, icons, etc.)
 * @param props.className - Additional CSS classes
 * @param props.onClick - Click event handler
 * @param props....props - All other standard HTML button attributes
 * 
 * @returns Rendered button element
 * 
 * @version 1.0.0
 * @since 1.0.0
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  /** Base classes applied to all button variants */
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
  
  /** 
   * Variant-specific styling classes
   * @description Defines colors, hover states, and focus rings for each button variant
   */
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 focus:ring-primary-500/50 shadow-lg hover:shadow-xl hover:shadow-primary-500/25',
    secondary: 'bg-gradient-to-r from-secondary-600 to-secondary-700 text-white hover:from-secondary-700 hover:to-secondary-800 focus:ring-secondary-500/50 shadow-lg hover:shadow-xl hover:shadow-secondary-500/25',
    danger: 'bg-gradient-to-r from-error-600 to-error-700 text-white hover:from-error-700 hover:to-error-800 focus:ring-error-500/50 shadow-lg hover:shadow-xl hover:shadow-error-500/25',
    outline: 'border-2 border-secondary-300 text-secondary-700 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-primary-300 focus:ring-primary-500/50 hover:shadow-md',
    white: 'bg-white/90 backdrop-blur-sm text-primary-600 hover:bg-white focus:ring-primary-500/50 shadow-lg hover:shadow-xl border border-white/40 hover:border-primary-200'
  };
  
  /** 
   * Size-specific padding and text classes
   * @description Controls button dimensions and typography for different sizes
   */
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
          role="presentation"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}; 
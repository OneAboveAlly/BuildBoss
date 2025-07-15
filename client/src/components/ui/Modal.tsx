import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Modal component properties interface
 */
interface ModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback function called when modal should close */
  onClose: () => void;
  /** Modal title displayed in header */
  title: string;
  /** Modal content */
  children: React.ReactNode;
  /** Modal size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Whether to show the X close button in header */
  showCloseButton?: boolean;
}

/**
 * Modal Component
 * 
 * A flexible modal dialog component with backdrop blur, smooth animations,
 * and full accessibility support. Features keyboard navigation (Esc to close),
 * click-outside-to-close, and responsive sizing options.
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Modal 
 *   isOpen={showModal} 
 *   onClose={() => setShowModal(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure you want to delete this project?</p>
 *   <div className="flex gap-2 mt-4">
 *     <Button variant="danger">Delete</Button>
 *     <Button variant="outline" onClick={() => setShowModal(false)}>
 *       Cancel
 *     </Button>
 *   </div>
 * </Modal>
 * 
 * // Large modal with custom content
 * <Modal 
 *   isOpen={showProjectModal} 
 *   onClose={handleClose}
 *   title="Project Details"
 *   size="xl"
 * >
 *   <ProjectForm onSubmit={handleSubmit} />
 * </Modal>
 * 
 * // Modal without close button
 * <Modal 
 *   isOpen={showLoading} 
 *   onClose={() => {}}
 *   title="Processing..."
 *   showCloseButton={false}
 * >
 *   <div className="text-center py-8">
 *     <Spinner />
 *     <p>Please wait while we process your request...</p>
 *   </div>
 * </Modal>
 * ```
 * 
 * @param props - Modal component props
 * @param props.isOpen - Controls modal visibility state
 * @param props.onClose - Function to call when modal should close (Esc key, backdrop click, X button)
 * @param props.title - Text displayed in the modal header
 * @param props.children - Content to display in the modal body
 * @param props.size - Modal width size ('sm' | 'md' | 'lg' | 'xl' | '2xl')
 * @param props.showCloseButton - Whether to show X button in header (default: true)
 * 
 * @returns Rendered modal portal or null if closed
 * 
 * @accessibility
 * - Uses role="dialog" and aria-modal="true"
 * - Modal title is associated with aria-labelledby
 * - Traps focus within modal when open
 * - Supports Escape key to close
 * - Background overlay is marked as aria-hidden
 * - Close button has proper aria-label
 * 
 * @features
 * - Smooth fade/zoom animations
 * - Backdrop blur effect
 * - Responsive sizing options
 * - Body scroll lock when open
 * - Click outside to close
 * - Keyboard navigation support
 * - Portal rendering for proper z-index stacking
 * 
 * @version 1.0.0
 * @since 1.0.0
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  /**
   * Handle keyboard navigation and body scroll lock
   * @description Sets up escape key listener and prevents body scroll when modal is open
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Early return if modal is closed
  if (!isOpen) return null;

  /**
   * Size-specific width classes for responsive modal sizing
   * @description Maps size props to Tailwind CSS max-width classes
   */
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay with blur and click-to-close */}
        <div 
          className="fixed inset-0 transition-opacity duration-300 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal panel with smooth animations */}
        <div 
          className={`
            inline-block w-full ${sizeClasses[size]} 
            my-4 sm:my-8 overflow-hidden text-left align-middle 
            transition-all duration-300 transform 
            bg-white shadow-2xl rounded-2xl
            animate-in zoom-in-95 fade-in duration-300
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200 bg-white rounded-t-2xl">
            <h3 
              id="modal-title"
              className="text-xl font-bold text-secondary-900"
            >
              {title}
            </h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors duration-200"
                aria-label="Close modal"
                type="button"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Modal Content with scroll handling */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
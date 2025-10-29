import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export interface ConfirmationModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  /**
   * Callback when the user confirms the action
   */
  onConfirm: () => void;
  /**
   * Modal title
   */
  title: string;
  /**
   * Modal description or message
   */
  description?: string;
  /**
   * Confirm button text
   * @default 'Confirm'
   */
  confirmText?: string;
  /**
   * Cancel button text
   * @default 'Cancel'
   */
  cancelText?: string;
  /**
   * Confirm button variant
   * @default 'destructive'
   */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  /**
   * Whether the confirm button is in a loading state
   * @default false
   */
  isLoading?: boolean;
  /**
   * Whether to show a warning icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom icon component
   */
  icon?: React.ReactNode;
  /**
   * Additional content to display
   */
  children?: React.ReactNode;
  /**
   * Whether to close the modal when clicking outside
   * @default true
   */
  closeOnOverlayClick?: boolean;
  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * Custom class name for the modal content
   */
  className?: string;
  /**
   * Custom class name for the overlay
   */
  overlayClassName?: string;
  /**
   * Custom class name for the title
   */
  titleClassName?: string;
  /**
   * Custom class name for the description
   */
  descriptionClassName?: string;
  /**
   * Custom class name for the buttons container
   */
  buttonsClassName?: string;
  /**
   * Custom class name for the confirm button
   */
  confirmButtonClassName?: string;
  /**
   * Custom class name for the cancel button
   */
  cancelButtonClassName?: string;
}

/**
 * A reusable confirmation modal dialog component.
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'destructive',
  isLoading = false,
  showIcon = true,
  icon,
  children,
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  buttonsClassName = '',
  confirmButtonClassName = '',
  cancelButtonClassName = '',
}: ConfirmationModalProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    onConfirm();
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay 
        className={cn(
          'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          overlayClassName
        )}
        onClick={handleOverlayClick}
      />
      <DialogContent
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200',
          'sm:rounded-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2',
          'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2',
          'data-[state=open]:slide-in-from-top-[48%]',
          className
        )}
      >
        {showCloseButton && (
          <button
            type="button"
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        )}

        <div className="flex flex-col space-y-4 text-center sm:text-left">
          <div className="flex flex-col items-center space-y-3 text-center">
            {showIcon && (
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                {icon || (
                  <svg
                    className="h-6 w-6 text-red-600 dark:text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>
            )}
            <DialogTitle
              className={cn(
                'text-lg font-semibold leading-none tracking-tight',
                titleClassName
              )}
            >
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription
                className={cn('text-sm text-muted-foreground', descriptionClassName)}
              >
                {description}
              </DialogDescription>
            )}
          </div>

          {children && <div className="py-2">{children}</div>}

          <div
            className={cn(
              'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
              buttonsClassName
            )}
          >
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className={cn(cancelButtonClassName)}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={confirmVariant}
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(confirmButtonClassName, {
                'opacity-60 cursor-not-allowed': isLoading,
              })}
            >
              {isLoading ? (
                <>
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

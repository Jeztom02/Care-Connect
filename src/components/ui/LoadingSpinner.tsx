import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gray';
  className?: string;
  label?: string;
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const colorClasses = {
  primary: 'text-primary-600',
  secondary: 'text-secondary-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-600',
  gray: 'text-gray-400',
};

const labelPositionClasses = {
  top: 'flex-col-reverse',
  bottom: 'flex-col',
  left: 'flex-row-reverse',
  right: 'flex-row',
};

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Loading...',
  labelPosition = 'bottom',
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    'inline-flex items-center justify-center',
    label && 'space-x-2',
    labelPositionClasses[labelPosition],
    className
  );

  const spinner = (
    <motion.div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color]
      )}
      style={{
        borderTopColor: 'transparent',
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
      }}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </motion.div>
  );

  if (!label) return spinner;

  return (
    <div className={containerClasses}>
      {spinner}
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
    </div>
  );
}

// Loading overlay component
export function LoadingOverlay({
  isLoading = true,
  text = 'Loading...',
  className = '',
}: {
  isLoading?: boolean;
  text?: string;
  className?: string;
}) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        {text && (
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

// Loading skeleton component
export function LoadingSkeleton({
  className = '',
  count = 1,
  height = '1.5rem',
  width = '100%',
  rounded = '0.375rem',
  spacing = '0.5rem',
}: {
  className?: string;
  count?: number;
  height?: string | number;
  width?: string | number;
  rounded?: string | number;
  spacing?: string | number;
}) {
  return (
    <div
      className={cn('flex flex-col', className)}
      style={{ gap: spacing }}
    >
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-gray-200 dark:bg-gray-700"
          style={{
            height,
            width,
            borderRadius: rounded,
          }}
        />
      ))}
    </div>
  );
}

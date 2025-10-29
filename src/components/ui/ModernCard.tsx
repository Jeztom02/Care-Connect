import { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ModernCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  hoverEffect?: 'scale' | 'lift' | 'shadow' | 'none';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: React.ReactNode;
}

const ModernCard = forwardRef<HTMLDivElement, ModernCardProps>(
  (
    {
      variant = 'default',
      hoverEffect = 'lift',
      rounded = 'lg',
      padding = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'transition-all duration-300';

    const variantClasses = {
      default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
      elevated: 'bg-white dark:bg-gray-800 shadow-md',
      outlined: 'bg-transparent border-2 border-gray-200 dark:border-gray-700',
      filled: 'bg-gray-50 dark:bg-gray-800/50',
    };

    const hoverClasses = {
      none: '',
      scale: 'hover:scale-[1.02]',
      lift: 'hover:-translate-y-1',
      shadow: 'hover:shadow-lg',
    };

    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full',
    };

    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-7',
      xl: 'p-9',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hoverEffect !== 'none' && hoverClasses[hoverEffect],
          roundedClasses[rounded],
          paddingClasses[padding],
          className
        )}
        whileHover={hoverEffect !== 'none' ? { scale: 1.01 } : {}}
        whileTap={hoverEffect !== 'none' ? { scale: 0.99 } : {}}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

ModernCard.displayName = 'ModernCard';

export { ModernCard };

// Card Header Component
export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 p-6 pb-2", className)}
    {...props}
  />
);

// Card Title Component
export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);

// Card Description Component
export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
);

// Card Content Component
export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

// Card Footer Component
export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
);

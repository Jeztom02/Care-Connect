import React, { forwardRef } from 'react';
import { getBackgroundStyles, getBlurDataURL } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';

export interface BackgroundImageProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Source URL for the default background image
   */
  src: string;
  /**
   * Source URL for dark mode background image
   */
  darkSrc?: string;
  /**
   * Source URL for mobile devices (up to 640px)
   */
  mobileSrc?: string;
  /**
   * Source URL for tablet devices (641px - 1024px)
   */
  tabletSrc?: string;
  /**
   * Source URL for desktop devices (1025px and up)
   */
  desktopSrc?: string;
  /**
   * Background size (cover, contain, etc.)
   * @default 'cover'
   */
  size?: 'cover' | 'contain' | 'auto' | string;
  /**
   * Background position
   * @default 'center'
   */
  position?: string;
  /**
   * Background repeat
   * @default 'no-repeat'
   */
  repeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y' | 'round' | 'space';
  /**
   * Blur effect (in pixels)
   * @default 0
   */
  blur?: number;
  /**
   * Overlay color (e.g., 'rgba(0, 0, 0, 0.5)')
   */
  overlayColor?: string;
  /**
   * Dark mode overlay color
   */
  darkOverlayColor?: string;
  /**
   * Background blend mode
   */
  blendMode?: string;
  /**
   * Dark mode blend mode
   */
  darkBlendMode?: string;
  /**
   * Whether to use a gradient overlay
   */
  gradient?: string;
  /**
   * Dark mode gradient
   */
  darkGradient?: string;
  /**
   * Whether to lazy load the background image
   * @default true
   */
  lazy?: boolean;
  /**
   * Whether to show a loading skeleton
   * @default true
   */
  showSkeleton?: boolean;
  /**
   * Skeleton background color
   * @default 'bg-gray-200 dark:bg-gray-800'
   */
  skeletonClass?: string;
}

/**
 * A responsive background image component with dark mode support and performance optimizations.
 */
const BackgroundImage = forwardRef<HTMLDivElement, BackgroundImageProps>(
  (
    {
      src,
      darkSrc,
      mobileSrc,
      tabletSrc,
      desktopSrc,
      size = 'cover',
      position = 'center',
      repeat = 'no-repeat',
      blur = 0,
      overlayColor,
      darkOverlayColor,
      blendMode = 'normal',
      darkBlendMode = 'multiply',
      gradient,
      darkGradient,
      lazy = true,
      showSkeleton = true,
      skeletonClass = 'bg-gray-200 dark:bg-gray-800',
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    // Preload images
    React.useEffect(() => {
      if (!lazy) return;

      const imageUrls = [src];
      if (darkSrc) imageUrls.push(darkSrc);
      if (mobileSrc) imageUrls.push(mobileSrc);
      if (tabletSrc) imageUrls.push(tabletSrc);
      if (desktopSrc) imageUrls.push(desktopSrc);

      let isMounted = true;

      const loadImage = (url: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        });
      };

      const preloadImages = async () => {
        try {
          await Promise.all(imageUrls.map(url => loadImage(url)));
          if (isMounted) {
            setIsLoaded(true);
            setIsLoading(false);
          }
        } catch (err) {
          console.error('Error preloading images:', err);
          if (isMounted) {
            setError(true);
            setIsLoading(false);
          }
        }
      };

      preloadImages();

      return () => {
        isMounted = false;
      };
    }, [src, darkSrc, mobileSrc, tabletSrc, desktopSrc, lazy]);

    // Generate background styles
    const backgroundStyles = React.useMemo(() => {
      if (error) return {};

      const styles: React.CSSProperties = {
        backgroundSize: size,
        backgroundPosition: position,
        backgroundRepeat: repeat,
        backgroundBlendMode: blendMode as any,
      };

      // Add background image
      if (isLoaded || !lazy) {
        styles.backgroundImage = getBackgroundStyles(
          {
            default: src,
            dark: darkSrc,
            mobile: mobileSrc,
            tablet: tabletSrc,
            desktop: desktopSrc,
          },
          {
            size,
            position,
            repeat,
            blendMode,
            darkModeBlendMode: darkBlendMode,
          }
        ).backgroundImage;
      }

      // Add blur effect
      if (blur > 0) {
        styles.filter = `blur(${blur}px)`;
        styles.transform = 'scale(1.05)'; // Prevent blurry edges
      }

      // Add overlay
      if (overlayColor || gradient) {
        const overlay = gradient || overlayColor;
        styles.backgroundImage = `${overlay}, ${styles.backgroundImage || ''}`.trim();
      }

      // Add dark mode overlay
      if (darkOverlayColor || darkGradient) {
        const darkOverlay = darkGradient || darkOverlayColor;
        (styles as any)['@media (prefers-color-scheme: dark)'] = {
          backgroundImage: `${darkOverlay}, ${styles.backgroundImage || ''}`.trim(),
        };
      }

      return styles;
    }, [
      src,
      darkSrc,
      mobileSrc,
      tabletSrc,
      desktopSrc,
      size,
      position,
      repeat,
      blur,
      overlayColor,
      darkOverlayColor,
      blendMode,
      darkBlendMode,
      gradient,
      darkGradient,
      isLoaded,
      lazy,
      error,
    ]);

    // Show skeleton while loading
    if (isLoading && showSkeleton) {
      return (
        <div
          ref={ref}
          className={cn('relative overflow-hidden', className, skeletonClass)}
          style={style}
          {...props}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse w-full h-full"></div>
          </div>
          {children}
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div
          ref={ref}
          className={cn(
            'relative bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
            className
          )}
          style={style}
          {...props}
        >
          <div className="text-center p-6">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-gray-600 dark:text-gray-400">
              Failed to load background image
            </p>
          </div>
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        style={{
          ...style,
          ...backgroundStyles,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BackgroundImage.displayName = 'BackgroundImage';

export { BackgroundImage };

/**
 * Utility functions for handling images and backgrounds
 */

interface ImageSources {
  default: string;
  dark?: string;
  mobile?: string;
  tablet?: string;
  desktop?: string;
}

/**
 * Generates CSS background image properties with responsive sources
 */
export const getBackgroundImage = (sources: ImageSources): string => {
  const { default: defaultSrc, dark, mobile, tablet, desktop } = sources;
  
  // Start with the default image
  let css = `url('${defaultSrc}')`;
  
  // Add dark mode variant if provided
  if (dark) {
    css += `, url('${dark}')`;
  }
  
  // Add responsive images if provided
  if (mobile) {
    css += `, url('${mobile}')`;
  }
  
  if (tablet) {
    css += `, url('${tablet}')`;
  }
  
  if (desktop) {
    css += `, url('${desktop}')`;
  }
  
  return css;
};

/**
 * Generates CSS for responsive background images with dark mode support
 */
export const getBackgroundStyles = (
  sources: ImageSources,
  options: {
    size?: string;
    position?: string;
    repeat?: string;
    blendMode?: string;
    darkModeBlendMode?: string;
  } = {}
): React.CSSProperties => {
  const {
    size = 'cover',
    position = 'center',
    repeat = 'no-repeat',
    blendMode = 'normal',
    darkModeBlendMode = 'multiply',
  } = options;

  const baseStyles: React.CSSProperties = {
    backgroundImage: getBackgroundImage(sources),
    backgroundSize: size,
    backgroundPosition: position,
    backgroundRepeat: repeat as any,
    backgroundBlendMode: blendMode as any,
  };

  // Add dark mode styles if dark variant is provided
  if (sources.dark) {
    return {
      ...baseStyles,
      '@media (prefers-color-scheme: dark)': {
        backgroundImage: `url('${sources.dark}')`,
        backgroundBlendMode: darkModeBlendMode as any,
      },
    } as any;
  }

  return baseStyles;
};

/**
 * Generates a blurry placeholder for images
 */
export const getBlurDataURL = (color: string = '#e5e7eb'): string => {
  // A tiny 1x1 pixel transparent PNG with the specified color
  const keyStr =
    'UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  return `data:image/png;base64,${keyStr}`;
};

/**
 * Optimizes image URL with query parameters for better performance
 */
export const optimizeImage = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png' | 'avif';
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  } = {}
): string => {
  if (!url) return '';
  
  // Skip if it's a data URL or already has query parameters
  if (url.startsWith('data:') || url.includes('?')) return url;
  
  const params = new URLSearchParams();
  
  if (options.width) params.append('w', options.width.toString());
  if (options.height) params.append('h', options.height.toString());
  if (options.quality) params.append('q', options.quality.toString());
  if (options.format) params.append('fm', options.format);
  if (options.fit) params.append('fit', options.fit);
  if (options.position) params.append('position', options.position);
  
  // Add auto-optimization parameters
  params.append('auto', 'format,compress');
  
  return `${url}?${params.toString()}`;
};

import { Request, Response, NextFunction } from 'express';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: http:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.googleapis.com https://*.gstatic.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  
  // Set charset for text/html responses
  const contentType = res.getHeader('Content-Type');
  if (typeof contentType === 'string' && contentType.startsWith('text/')) {
    res.setHeader('Content-Type', `${contentType}; charset=utf-8`);
  }
  
  next();
};

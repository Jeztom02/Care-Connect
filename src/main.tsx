import React from 'react';
import { createRoot } from "react-dom/client";
import '@fontsource-variable/inter';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import App from "./App.tsx";
import "./index.css";
import "./styles/fixes.css";

// Performance optimization - use createRoot with concurrent mode
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Add performance monitoring in development
if (import.meta.env.DEV) {
  // Use dynamic import to avoid including web-vitals in production
  import('web-vitals').then((webVitals) => {
    try {
      // Only log in development
      const log = (metric: any) => {
        console.log('[Web Vitals]', metric.name, Math.round(metric.value * 10) / 10, metric);
      };
      
      // Web Vitals v3+ uses a different API
      if (webVitals && typeof webVitals === 'object') {
        // Check for the new API first (v3+)
        if (typeof webVitals.onFCP === 'function') {
          webVitals.onFCP(log);
        }
        if (typeof webVitals.onLCP === 'function') {
          webVitals.onLCP(log);
        }
        if (typeof webVitals.onCLS === 'function') {
          webVitals.onCLS(log);
        }
        if (typeof webVitals.onFID === 'function') {
          webVitals.onFID(log);
        }
        if (typeof webVitals.onTTFB === 'function') {
          webVitals.onTTFB(log);
        }
      }
      
      console.log('[Web Vitals] Performance monitoring initialized');
    } catch (err) {
      console.warn('Error initializing web-vitals:', err);
    }
  }).catch(error => {
    console.warn('Failed to load web-vitals. This is not critical to the app functionality.', error);
  });
}

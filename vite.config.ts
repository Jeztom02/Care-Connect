import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import type { PluginOption } from 'vite';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];
  
  // Only include componentTagger in development mode
  if (mode === 'development' && componentTagger) {
    const tagger = componentTagger();
    if (tagger) {
      plugins.push(tagger);
    }
  }

  return {
    base: '/',
    publicDir: 'public',
    server: {
      host: "::",
      port: 5173,
      strictPort: false,
      open: false,
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
      fs: {
        strict: true,
      },
      cors: true,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          },
        },
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.ts': 'tsx',
        },
      },
    },
  };
});

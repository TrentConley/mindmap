import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// This function configures the Vite setup differently based on the environment
export default defineConfig(({ mode }) => {
  // Base configuration shared between all environments
  const config = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
      },
    },
    server: {
      host: '0.0.0.0', // Make it accessible from other devices if needed
      proxy: {} // Initialize the proxy object
    },
  };

  // Only add proxy configuration in development mode
  if (mode === 'development') {
    config.server.proxy = {
      '/api': {
        target: 'http://0.0.0.0:8000',
        changeOrigin: true,
        rewrite: (path) => path, // Don't rewrite the path
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
    };
  }

  return config;
});
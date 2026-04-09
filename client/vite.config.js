import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/login': 'http://localhost:3000',
      '/register': 'http://localhost:3000',
      '/check-username': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/get-user-info': 'http://localhost:3000',
      '/write-letter': 'http://localhost:3000',
      '/get-upload-url': 'http://localhost:3000',
      '/db-test': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist',
  },
});

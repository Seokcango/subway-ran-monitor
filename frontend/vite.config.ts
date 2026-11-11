import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 백엔드(FastAPI)가 생기면 /api 요청을 그쪽으로 넘긴다.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});

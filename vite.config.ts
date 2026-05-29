import vue from '@vitejs/plugin-vue';
import devServer from '@hono/vite-dev-server';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue(),
    devServer({
      entry: 'server/app.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': new URL('.', import.meta.url).pathname,
    },
  },
  server: {
    port: 3000,
  },
});

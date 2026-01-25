import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'url';
import viteConfig from './vite.config';
console.log('Debugging alias resolution:', fileURLToPath(new URL('./src', import.meta.url)));

export default defineConfig({
  ...viteConfig,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      colorMode: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['computer.javiergonzalez.io', 'dev.computer.javiergonzalez.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    include: [
      '@vueuse/core',
      '@nuxt/ui > prosemirror-state',
      '@nuxt/ui > prosemirror-transform',
      '@nuxt/ui > prosemirror-model',
      '@nuxt/ui > prosemirror-view',
      '@nuxt/ui > prosemirror-gapcursor',
    ],
  },
})


import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages: sayt https://adix7pro.github.io/miniapp/ manzilida turadi
  base: '/miniapp/',
  plugins: [vue()],
  server: {
    host: true, // bind to IPv4 to avoid ::1 issues
    port: 7777,
    strictPort: false, // true bo'lsa port band bo'lsa xato beradi; false bo'lsa keyingi bo'sh portga o'tadi
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'loyalty.erkaboyev.uz'  // This will allow all ngrok-free.app subdomains
    ]
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5188,
    strictPort: false, // 若 5188 被占用则自动尝试下一端口
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

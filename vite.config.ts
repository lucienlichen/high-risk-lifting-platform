import { execSync } from 'child_process'
import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

function buildVersion(): Plugin {
  const sha = () => {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()
    } catch {
      return 'unknown'
    }
  }
  return {
    name: 'build-version',
    apply: 'build',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { name: 'build-sha', content: sha() }, injectTo: 'head' }]
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.txt', source: `${sha()}\n` })
    }
  }
}

export default defineConfig({
  plugins: [vue(), buildVersion()],
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

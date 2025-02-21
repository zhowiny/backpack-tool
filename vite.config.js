import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import monkey, { cdn, util } from 'vite-plugin-monkey'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    minify: false,
  },
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        name: 'desk exchange tool',
        description: 'desk exchange script 刷成交量脚本',
        author: 'zhowiny',
        namespace: 'https://github.com/zhowiny',
        icon: 'https://desk.exchange/icons/favicon.ico',
        match: ['https://desk.exchange/trade/*'],
        require: [
        ],
      },
      build: {
        externalGlobals: {
          vue: cdn
            .jsdelivr('Vue', 'dist/vue.global.prod.js')
            .concat(util.dataUrl(';window.Vue=Vue;')),
        },
      },
    }),
  ],
})

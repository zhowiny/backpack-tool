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
        name: 'backpack tool',
        description: 'backpack script 刷成交量脚本,支持手动开启关闭,设置买入卖出点',
        author: 'oooooyoung & zhowiny',
        namespace: 'https://github.com/zhowiny',
        icon: 'https://backpack.exchange/favicon-32x32.png',
        match: ['https://backpack.exchange/trade/*'],
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

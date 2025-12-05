import { resolve } from 'node:path'

import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  build: {
    cssCodeSplit: true,
    minify: true,
    modulePreload: { polyfill: false },
    rolldownOptions: {
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
      },
    },
    sourcemap: false,
    target: 'es2022',
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      // https://react.dev/learn/react-compiler
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              target: '19',
            },
          ],
        ],
      },
    }),
    devtools(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'react-dom/server': 'react-dom/server.edge',
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    allowedHosts: ['.localcan.dev'],
  },
})

import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // open the connection to the API while the JS bundle is still downloading
        name: 'preconnect-api',
        transformIndexHtml: () =>
          apiUrl
            ? [
                {
                  tag: 'link',
                  attrs: { rel: 'preconnect', href: apiUrl, crossorigin: 'use-credentials' },
                  injectTo: 'head-prepend' as const,
                },
              ]
            : [],
      },
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})

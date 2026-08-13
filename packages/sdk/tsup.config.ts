import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'Lumen',
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2020',
})

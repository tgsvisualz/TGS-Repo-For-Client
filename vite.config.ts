import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// `vite build --mode artifact` emits one self-contained HTML file (fonts, CSS, JS and the
// lazy 3D chunk all inlined) for the private claude.ai preview link. Regular builds stay
// code-split, with the 3D showroom in its own chunk.
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact'
  return {
    base: './',
    plugins: artifact ? [react(), viteSingleFile({ removeViteModuleLoader: true })] : [react()],
    build: {
      outDir: artifact ? 'dist-artifact' : 'dist',
      target: 'es2022',
      assetsInlineLimit: artifact ? 100_000_000 : 4096,
      chunkSizeWarningLimit: artifact ? 8000 : 1800,
    },
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
  }
})

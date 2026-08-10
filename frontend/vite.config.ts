import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Aspire AppHost injects PORT when it launches the Vite dev server.
const port = process.env.PORT ? Number(process.env.PORT) : 5173

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Keeps the WebGL stack out of the entry chunk so routes without a
        // canvas are not paying for it.
        manualChunks(id) {
          // Normalised because module ids use backslashes on Windows.
          const path = id.replace(/\\/g, '/')
          if (path.includes('node_modules/three/')) return 'three'
          if (path.includes('node_modules/@react-three/')) return 'r3f'
          return undefined
        },
      },
    },
  },
})

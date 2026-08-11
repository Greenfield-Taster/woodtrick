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
    /*
     * No manual chunking. Naming the WebGL packages as their own chunk did
     * keep them out of the entry file, but a named chunk is counted as part
     * of the initial set and was emitted as a `modulepreload` in index.html —
     * so every page fetched all of three up front, catalogue included. The
     * canvases are behind dynamic imports now, and letting the bundler cut
     * the chunks itself is what actually makes them load on demand.
     */
  },
})

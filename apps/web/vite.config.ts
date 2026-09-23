import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    /* Colocated `components/` folders inside src/routes are not routes. Without
       this the generator treats every file under routes/ as one. */
    tanstackStart({ router: { routeFileIgnorePattern: 'components' } }),
    nitro(),
    react(),
    tailwindcss(),
  ],
})

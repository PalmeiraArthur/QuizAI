import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),tailwindcss(),
  ],
  define: {
    // Substitui todas as ocorrências de 'global' por 'window'
    global: 'window', 
  },
})

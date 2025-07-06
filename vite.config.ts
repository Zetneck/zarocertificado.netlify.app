import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar Material-UI en su propio chunk
          'mui': ['@mui/material', '@mui/icons-material', '@mui/x-date-pickers'],
          // Separar jsPDF en su propio chunk
          'pdf': ['jspdf'],
          // Separar React en su propio chunk
          'react': ['react', 'react-dom'],
          // Separar dayjs en su propio chunk
          'date': ['dayjs']
        }
      }
    },
    // Aumentar el límite de advertencia de chunk size
    chunkSizeWarningLimit: 1000
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 'build' वाला हिस्सा हटा दो या कमेंट कर दो ताकि console.log न हटें
  /* build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, 
        drop_debugger: true,
      },
    },
  },
  */
})
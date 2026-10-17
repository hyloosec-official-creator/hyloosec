import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator';
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    // कोड को obfuscate करने के लिए
    javascriptObfuscator({
      compact: true,
      controlFlowFlattening: true, // कोड के लॉजिक फ्लो को उलझा देगा
      controlFlowFlatteningThreshold: 1,
      numbersToExpressions: true,
      simplify: true,
      stringArrayShuffle: true,
      splitStrings: true,
      stringArrayThreshold: 1,
    }),
    visualizer({
      filename: "dist/bundle-report.html",
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // कंसोल लॉग्स को हटा देगा
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; // सारी बड़ी लाइब्रेरीज़ (socket, react, आदि) को 'vendor' फाइल में अलग कर देगा
          }
        }
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 600, // वॉर्निंग लिमिट थोड़ी बढ़ा दी है
  },
});
// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       "/api": {
//         target: "http://127.0.0.1:8000",   // ⬅️ trỏ đúng vào artisan serve
//         changeOrigin: true,
//         // KHÔNG rewrite, giữ nguyên đường dẫn /api/...
//       },
//     },
//   },
// });



import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),   // <-- alias tới src
    },
  },
})

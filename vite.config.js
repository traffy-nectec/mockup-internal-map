import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mockup-internal-map/', // <--- ต้องตรงกับชื่อ repo ของคุณเป๊ะๆ
})
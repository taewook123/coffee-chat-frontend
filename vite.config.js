import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // 👈 절대 경로(@) 인식을 위해 내장 모듈 임포트

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 기존에 들어있던 Tailwind CSS 설정 유지
  ],
  // 🔥 [추가] ngrok 호스트 차단 문제를 해결하는 설정
  server: {
    allowedHosts: true, 
  },
  // 💡 [추가] 혹시 나중에 쓸 수 있으니 @ 기호를 src 폴더로 연결해주는 설정도 합쳤습니다.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
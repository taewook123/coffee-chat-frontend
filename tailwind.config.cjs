/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // 👇 이 부분을 추가해 주세요!
      fontFamily: {
        sans: ["Pretendard", "Pretendard Variable", "sans-serif"],
      },
    },
  },
  plugins: [],
}
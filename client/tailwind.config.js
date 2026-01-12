/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#7852FD",
        text: "#120125",
        background: "#FFFFFF",
        surface: "#F8F9FA",
        border: "#E9ECEF",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ['Urbanist', 'sans-serif'],
        script: ['Vibur', 'cursive'],
      },
    },
  },
  plugins: [],
}

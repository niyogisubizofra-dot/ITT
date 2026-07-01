/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: 'var(--color-bg)',
          primary: '#2563eb',
          secondary: 'var(--color-bg-secondary)',
          accent: '#0ea5e9',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          border: 'var(--color-border)'
        }
      }
    },
  },
  plugins: [],
}

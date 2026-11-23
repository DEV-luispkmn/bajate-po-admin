/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          dark: '#0d1117',
          card: '#161b22',
          border: '#30363d',
          input: '#21262d',
          orange: '#ff6b00',
          amber: '#ffb300',
          green: '#2ea043',
          red: '#f85149',
          blue: '#58a6ff',
          muted: '#8b949e',
        }
      }
    },
  },
  plugins: [],
}

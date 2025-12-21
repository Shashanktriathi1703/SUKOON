/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',  // Emerald green
        secondary: '#06b6d4', // Cyan
        accent: '#f59e0b',    // Amber
        bgLight: '#f0fdfa',   // Mint
        bgDark: '#0f172a',    // Slate
      },
      animation: {
        ripple: 'ripple 0.6s linear',
        floatLeaf: 'floatLeaf 10s infinite ease-in-out',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: 1 },
          '100%': { transform: 'scale(4)', opacity: 0 },
        },
        floatLeaf: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '50%': { transform: 'translate(10px, -20px) rotate(5deg)' },
        },
      },
      backgroundImage: {
        'leaf-pattern': "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmc8L2c+PC9zdmc+')",  // Add real base64 SVG for leaves
      },
    },
  },
  plugins: [],
  darkMode: 'class',  // Enable dark mode
};
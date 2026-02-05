/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./resources/**/*.{blade.php,js,jsx}'],
  theme: {
    extend: {
      animation: {
        blob: 'blob 4s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(40px,-40px) scale(1.4)' },
          '100%': { transform: 'translate(0,0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
}


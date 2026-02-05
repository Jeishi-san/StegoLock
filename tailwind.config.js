/** @type {import('tailwindcss').Config} */
export default {
  content: ['./resources/**/*.{blade.php,js,jsx,}'],
  theme: {
    extend: {
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '25%': { transform: 'translate(50px, -60px) scale(1.2)' },
          '50%': { transform: 'translate(-40px, 50px) scale(0.8)' },
          '75%': { transform: 'translate(30px, 30px) scale(1.1)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },
      animation: {
        blob: 'blob 4s infinite ease-in-out', // faster and smoother
      },
    },
  },
  plugins: [],
};

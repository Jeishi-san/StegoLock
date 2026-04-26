import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                cyber: {
                    void: '#020617', // Slate 950
                    surface: '#0f172a', // Slate 900
                    border: '#1e293b', // Slate 800
                    accent: '#22d3ee', // Cyan 400
                    'accent-dark': '#0891b2', // Cyan 600
                    muted: '#64748b', // Slate 500
                }
            },
            boxShadow: {
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.2)',
                'glow-cyan-strong': '0 0 30px rgba(34, 211, 238, 0.4)',
            }
        },
    },

    plugins: [forms],
};

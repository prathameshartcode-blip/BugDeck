// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(220, 90%, 55%)',
        secondary: 'hsl(340, 70%, 55%)',
        accent: 'hsl(45, 90%, 55%)',
        background: 'hsl(210, 20%, 98%)',
        foreground: 'hsl(210, 15%, 20%)',
        glass: 'rgba(255,255,255,0.2)'
      },
      fontSize: {
        'xs': ['0.9375rem', { lineHeight: '1.35rem' }],
        'sm': ['1.0625rem', { lineHeight: '1.6rem' }],
        'base': ['1.1875rem', { lineHeight: '1.85rem' }],
        'lg': ['1.375rem', { lineHeight: '2rem' }],
        'xl': ['1.5625rem', { lineHeight: '2.15rem' }],
        '2xl': ['1.8125rem', { lineHeight: '2.4rem' }],
        '3xl': ['2.1875rem', { lineHeight: '2.7rem' }],
        '4xl': ['2.5625rem', { lineHeight: '3rem' }],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px'
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

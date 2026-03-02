import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Visuo design palette - enhanced
        'black': '#121116',
        'purple-dark': '#1c1825',
        'purple-accent': '#6b4ceb',
        'purple-light': '#9378ff',
        'purple': '#6b4ceb',
        'blue-dark': '#02071a',
        'blue': '#0b1023',
        'grey': '#c3c3c3',
        'grey-light': '#eeecea',
        'white': '#ffffff',
        'gray': {
          100: '#ddd',
          200: '#b6b6b6',
          300: '#808080',
          400: '#474747',
          500: '#333333',
          600: '#292929',
          700: '#171717',
          800: '#0f0f0f',
          900: '#0a0a0a',
        },
      },
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5' }],
        'sm': ['0.875rem', { lineHeight: '1.42' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.125rem', { lineHeight: '1.5' }],
        'xl': ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.33' }],
        '3xl': ['1.75rem', { lineHeight: '1.5' }],
        '4xl': ['2rem', { lineHeight: '1.5' }],
        '5xl': ['3.75rem', { lineHeight: '1.2', letterSpacing: '-0.13125rem' }],
        '6xl': ['6rem', { lineHeight: '1', letterSpacing: '0' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.27rem' }],
        '8xl': ['3.5rem', { lineHeight: '1' }],
        '9xl': ['3rem', { lineHeight: '1.16', letterSpacing: '-0.105rem' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-hero': 'radial-gradient(ellipse at top, rgba(107, 76, 235, 0.3) 0%, rgba(28, 24, 37, 0.8) 50%, rgba(18, 17, 22, 1) 100%)',
        'gradient-card': 'radial-gradient(circle at top right, rgba(107, 76, 235, 0.1) 0%, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(107, 76, 235, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(107, 76, 235, 0.6)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(107, 76, 235, 0.2)',
      },
    },
  },
  plugins: [],
}

export default config

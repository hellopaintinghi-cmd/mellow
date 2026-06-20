/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream:   { DEFAULT: '#FAF7F2', 50: '#FEFCFA', 100: '#FAF7F2', 200: '#F0E8DB', 300: '#E0CDB5', 400: '#C9A87E' },
        sage:    { DEFAULT: '#7FAE7A', 50: '#F2F7F1', 100: '#D5E8C8', 200: '#9FCB8E', 300: '#7FAE7A', 400: '#5C8A4E', 500: '#3E6634' },
        lavender:{ DEFAULT: '#C9A0DC', 50: '#F9F3FC', 100: '#EDDBF7', 200: '#D9B8F0', 300: '#C9A0DC', 400: '#A874C5', 500: '#8050A8' },
        dusty:   { DEFAULT: '#F2B6C6', 50: '#FFF0F4', 100: '#FFD9E6', 200: '#F2B6C6', 300: '#E891A5', 400: '#D9637E', 500: '#B84060' },
        warm:    { DEFAULT: '#D8A47F', 50: '#FBF4EF', 100: '#F2DCCA', 200: '#E8BF9C', 300: '#D8A47F', 400: '#C07B50', 500: '#9A5A30' },
        mellow: {
          night:   '#1E2233',
          surface: '#2A2E3E',
          card:    '#32374A',
          border:  '#3E4560',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        dancing: ['"Dancing Script"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft:  '0 4px 24px 0 rgba(30,34,51,0.08)',
        glow:  '0 0 24px 4px rgba(201,160,220,0.18)',
        card:  '0 2px 16px 0 rgba(30,34,51,0.12)',
        deep:  '0 8px 40px 0 rgba(30,34,51,0.22)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 9s ease-in-out infinite',
        'pulse-soft':  'pulseSoft 4s ease-in-out infinite',
        'rain':        'rain 1.2s linear infinite',
        'snow':        'snow 3s linear infinite',
        'particle':    'particle 8s linear infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'pixel-blink': 'pixelBlink 1s step-end infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0.6 },
        },
        rain: {
          '0%':   { transform: 'translateY(-10px)', opacity: 0 },
          '10%':  { opacity: 1 },
          '90%':  { opacity: 1 },
          '100%': { transform: 'translateY(100vh)', opacity: 0 },
        },
        snow: {
          '0%':   { transform: 'translateY(-10px) translateX(0)', opacity: 0 },
          '10%':  { opacity: 1 },
          '90%':  { opacity: 0.8 },
          '100%': { transform: 'translateY(100vh) translateX(20px)', opacity: 0 },
        },
        particle: {
          '0%':   { transform: 'translateY(100vh) scale(0)', opacity: 0 },
          '10%':  { opacity: 0.7 },
          '90%':  { opacity: 0.3 },
          '100%': { transform: 'translateY(-10vh) scale(1)', opacity: 0 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition:  '200% center' },
        },
        pixelBlink: {
          '0%,100%': { opacity: 1 },
          '50%':     { opacity: 0 },
        },
      },
    },
  },
  plugins: [],
}

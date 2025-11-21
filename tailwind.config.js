/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
        fontFamily: {
            sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['JetBrains Mono', 'Consolas', 'monospace'],
            grotesk: ['Space Grotesk', 'sans-serif'],
        },
        spacing: {
          'safe-top': 'env(safe-area-inset-top)',
          'safe-bottom': 'env(safe-area-inset-bottom)',
          'safe-left': 'env(safe-area-inset-left)',
          'safe-right': 'env(safe-area-inset-right)',
        },
        minHeight: {
          'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        },
        maxWidth: {
          'screen': '100vw',
        },
        keyframes: {
            'float-particle': {
                '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
                '20%': { opacity: '1' },
                '100%': { transform: 'translateY(-60px) translateX(20px)', opacity: '0' },
            },
            'pulse-glow-red': {
                '0%, 100%': { filter: 'drop-shadow(0 0 5px rgba(239,68,68,0.5))' },
                '50%': { filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.8))' },
            },
            'glitch-jitter': {
                '0%': { transform: 'translate(0,0)', opacity: '1', filter: 'brightness(1)' },
                '92%': { transform: 'translate(0,0)', opacity: '1', filter: 'brightness(1)' },
                '93%': { transform: 'translate(-2px, 1px)', opacity: '0.8', filter: 'brightness(1.2) hue-rotate(90deg)' },
                '94%': { transform: 'translate(2px, -1px)', opacity: '0.9', filter: 'brightness(0.8)' },
                '95%': { transform: 'translate(-1px, -2px)', opacity: '1', filter: 'brightness(1.1)' },
                '96%': { transform: 'translate(0,0)', opacity: '1', filter: 'brightness(1)' },
                '100%': { transform: 'translate(0,0)', opacity: '1', filter: 'brightness(1)' },
            },
            'pixel-float': {
                '0%': { transform: 'translate(0, 0) scale(1)', opacity: '1' },
                '20%': { opacity: '1' },
                '50%': { transform: 'translate(10px, -15px) scale(0.8)', opacity: '0.8' },
                '100%': { transform: 'translate(25px, -40px) scale(0)', opacity: '0' },
            },
            fadeIn: {
                from: { opacity: '0', transform: 'translateY(20px)' },
                to: { opacity: '1', transform: 'translateY(0)' },
            },
            slideInRight: {
                from: { opacity: '0', transform: 'translateX(30px)' },
                to: { opacity: '1', transform: 'translateX(0)' },
            },
            slideInUp: {
                from: { opacity: '0', transform: 'translateY(30px)' },
                to: { opacity: '1', transform: 'translateY(0)' },
            },
            pop: {
                '0%': { opacity: '0', transform: 'scale(0.8)' },
                '50%': { transform: 'scale(1.05)' },
                '100%': { opacity: '1', transform: 'scale(1)' },
            },
            zoomIn: {
                from: { opacity: '0', transform: 'scale(0.9)' },
                to: { opacity: '1', transform: 'scale(1)' },
            },
        },
        animation: {
            'particle': 'float-particle 2.5s infinite ease-out',
            'glow-red': 'pulse-glow-red 2s infinite',
            'glitch': 'glitch-jitter 3s infinite',
            'pixel': 'pixel-float 2s infinite steps(4)',
            'fadeIn': 'fadeIn 0.8s ease-out',
            'slideInRight': 'slideInRight 0.6s ease-out',
            'slideInUp': 'slideInUp 0.3s ease-out',
            'pop': 'pop 0.2s ease-out',
            'zoomIn': 'zoomIn 0.5s ease-out',
        },
    },
  },
  plugins: [],
}

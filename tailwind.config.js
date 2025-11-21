/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
            grotesk: ['Space Grotesk', 'sans-serif'],
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
        },
        animation: {
            'particle': 'float-particle 2.5s infinite ease-out',
            'glow-red': 'pulse-glow-red 2s infinite',
            'glitch': 'glitch-jitter 3s infinite',
            'pixel': 'pixel-float 2s infinite steps(4)',
        }
    },
  },
  plugins: [],
}

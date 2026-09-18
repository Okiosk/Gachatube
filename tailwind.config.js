/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Cinzel', 'Outfit', 'sans-serif'],
        pokemon: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        body:    ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        pokemon: {
          yellow:      '#ffcb05',
          gold:        '#f59e0b',
          blue:        '#2a75bb',
          darkblue:    '#1c4b82',
          red:         '#ef4444',
          darkred:     '#991b1b',
          navy:        '#0a0e1a',
          surface:     '#10172a',
          card:        '#162036',
          border:      '#233354',
          cardBorder:  '#facc15',
          silver:      '#cbd5e1',
        },
        tcg: {
          bg:          '#06080f',
          surface:     '#0c1222',
          card:        '#111e35',
          'card-dark': '#090d1c',
          gold:        '#c9a227',
          'gold-bright':'#f0c040',
          'gold-dim':  '#3d3010',
          silver:      '#9aa3b0',
          text:        '#e8d8b0',
          'text-dim':  '#8a7a5a',
          'text-muted':'#3d3a28',
        },
        rarity: {
          commune:  '#71717a',
          uncommon: '#10b981',
          rare:     '#3b82f6',
          ultra:    '#7c3aed',
          mythic:   '#f59e0b',
        },
      },
      keyframes: {
        foilShift: {
          '0%':   { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        packFloat: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-1deg)' },
          '50%':       { transform: 'translateY(-10px) rotate(1deg)' },
        },
        cardFlipIn: {
          '0%':   { transform: 'perspective(1000px) rotateY(90deg) scale(0.92)', opacity: '0' },
          '100%': { transform: 'perspective(1000px) rotateY(0deg) scale(1)',    opacity: '1' },
        },
        burstGlow: {
          '0%':   { opacity: '0', transform: 'scale(0.8)' },
          '40%':  { opacity: '1', transform: 'scale(1.2)' },
          '100%': { opacity: '0', transform: 'scale(2)' },
        },
        rarityBurst: {
          '0%':   { opacity: '0.8', transform: 'scale(0.5)' },
          '60%':  { opacity: '0.3', transform: 'scale(1.5)' },
          '100%': { opacity: '0',   transform: 'scale(2.2)' },
        },
        packTear: {
          '0%':   { transform: 'scaleY(1) translateY(0)',             opacity: '1' },
          '40%':  { transform: 'scaleY(1.08) translateY(-12px) rotate(2deg)', opacity: '1' },
          '100%': { transform: 'scaleY(0) translateY(-80px) rotate(8deg)',    opacity: '0' },
        },
        stripShimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(201,162,39,0.3)' },
          '50%':       { boxShadow: '0 0 24px rgba(201,162,39,0.6)' },
        },
      },
      animation: {
        foilShift:   'foilShift 4s ease-in-out infinite alternate',
        packFloat:   'packFloat 3.5s ease-in-out infinite',
        cardFlipIn:  'cardFlipIn 0.45s ease-out forwards',
        burstGlow:   'burstGlow 0.9s ease-out forwards',
        rarityBurst: 'rarityBurst 0.65s ease-out forwards',
        packTear:    'packTear 0.9s cubic-bezier(0.4,0,0.2,1) 0.1s forwards',
        stripShimmer:'stripShimmer 2.5s infinite linear',
        goldPulse:   'goldPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

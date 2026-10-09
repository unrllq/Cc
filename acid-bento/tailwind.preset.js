// ACID BENTO — Tailwind preset
// tailwind.config.js:  module.exports = { presets: [require('./acid-bento/tailwind.preset.js')], content: [...] }
const t = require('./tokens.json');

module.exports = {
  theme: {
    extend: {
      colors: { ab: t.color },
      fontFamily: {
        condensed: ['Anton', 'Bebas Neue', 'Impact', 'sans-serif'],
        wide: ['Unbounded', 'Arial Black', 'sans-serif'],
        sticker: ['Rubik Mono One', 'Dela Gothic One', 'Arial Black', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'monospace'],
        pixel: ['Silkscreen', 'Space Mono', 'monospace'],
      },
      borderRadius: {
        'ab-sm': `${t.radius.sm}px`,
        ab: `${t.radius.md}px`,
        'ab-lg': `${t.radius.lg}px`,
      },
      boxShadow: {
        hard: t.shadow.hard,
        'hard-lg': t.shadow.hardHover,
        'hard-lime': '6px 6px 0 #c6ff1a',
      },
      dropShadow: {
        float: '0 12px 18px rgba(0,0,0,.45)',
      },
      transitionTimingFunction: {
        'ab-out': `cubic-bezier(${t.motion.easeOut.join(',')})`,
        'ab-snap': `cubic-bezier(${t.motion.easeSnap.join(',')})`,
      },
      keyframes: {
        'ab-rise': { from: { opacity: '0', transform: 'translateY(32px)' }, to: { opacity: '1', transform: 'none' } },
        'ab-pop': {
          '0%': { opacity: '0', transform: 'scale(0) rotate(-12deg)' },
          '60%': { opacity: '1', transform: 'scale(1.15) rotate(-4deg)' },
          '80%': { transform: 'scale(.95) rotate(-7deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-6deg)' },
        },
        'ab-float': { '0%,100%': { translate: '0 0', rotate: '-3deg' }, '50%': { translate: '0 -10px', rotate: '3deg' } },
        'ab-marquee': { to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'ab-rise': 'ab-rise .6s cubic-bezier(0.16,1,0.3,1) both',
        'ab-pop': 'ab-pop .5s cubic-bezier(0.34,1.56,0.64,1) both',
        'ab-float': 'ab-float 5s ease-in-out infinite',
        'ab-marquee': 'ab-marquee 30s linear infinite',
      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.ab-sticker': {
          fontFamily: "'Rubik Mono One', 'Dela Gothic One', sans-serif",
          textTransform: 'uppercase',
          lineHeight: '0.95',
          letterSpacing: '-0.02em',
          '-webkit-text-stroke': '0.06em #000',
          paintOrder: 'stroke fill',
          textShadow: t.shadow.extrude,
          transform: 'rotate(-6deg)',
          display: 'inline-block',
        },
      });
    },
  ],
};

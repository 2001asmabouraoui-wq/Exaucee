/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  safelist: [
    { pattern: /bg-ex-/,     variants: ['hover', 'focus', 'group-hover'] },
    { pattern: /text-ex-/,   variants: ['hover', 'focus', 'group-hover'] },
    { pattern: /border-ex-/, variants: ['hover', 'focus'] },
    'bg-ex-vanilla', 'bg-ex-blush-cream', 'bg-ex-soft-rose', 'bg-ex-mint-frost', 'bg-ex-lavender-mist',
  ],
  theme: {
    extend: {
      fontFamily: {
        Manrope: ['Manrope', 'sans-serif'],
        Cairo:   ['Cairo', 'sans-serif'],
      },
      colors: {
        // ── Official palette ──
        'ex-vanilla':          '#FFF9F4',   // Vanilla Whip — main background
        'ex-blush-cream':      '#FDEEF1',   // Blush Cream — lightest pink, blush cards
        'ex-soft-rose':        '#F7D9E0',   // Soft Rose — pink accent sections
        'ex-mint-frost':       '#D6E9DC',   // Mint Frost — green accent sections
        'ex-lavender-mist':    '#C6B7CC',   // Lavender Mist — lavender accent
        // ── Brand action colors ──
        'ex-rose':             '#C4828A',   // rose — primary brand CTA colour
        'ex-rose-deep':        '#A85560',   // deeper rose for hover states
        'ex-gold':             '#C9A45A',   // warm gold for borders & details
        'ex-brown':            '#3D2B1F',   // dark warm brown for text
        // ── Aliases kept for compatibility ──
        'ex-cream':            '#FFF9F4',
        'ex-cream-dark':       '#FDEEF1',
        'ex-blush':            '#F7D9E0',
        'ex-sage':             '#8FA89C',
        'ex-sage-light':       '#D6E9DC',
        'ex-mint':             '#A8D4C2',
        'ex-mint-light':       '#D6E9DC',
        'ex-periwinkle':       '#C6B7CC',
        'ex-periwinkle-light': '#F7D9E0',
        'ex-lavender':         '#C6B7CC',
        'ex-lavender-light':   '#FDEEF1',
        'k-black':             '#FFF9F4',
        'k-main':              '#FDEEF1',
        'k-dark-grey':         '#D6E9DC',
        'k-grey':              '#F7D9E0',
        'k-light-grey':        '#FFF9F4',
      },
      letterSpacing: {
        broad:    '0.5em',
        broader:  '0.75em',
        broadest: '1em',
      },
    },
  },
  plugins: [],
}

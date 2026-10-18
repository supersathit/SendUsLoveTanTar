export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: Object.fromEntries(['bg', 'surface', 'primary', 'primary-dark', 'accent', 'text', 'muted', 'border', 'danger', 'success', 'wish-bg', 'wish-text', 'wish-muted', 'wish-border', 'wish-detail-bg'].map(name => [name, `var(--color-${name})`])),
      fontFamily: { sans: ['var(--font-body)'], heading: ['var(--font-heading)'], script: ['var(--font-script)'], serif: ['var(--font-serif)'] },
    },
  },
  plugins: [],
};

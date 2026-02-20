module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        mocha: {
          50: 'var(--mocha-50)',
          100: 'var(--mocha-100)',
          200: 'var(--mocha-200)',
          300: 'var(--mocha-300)',
          400: 'var(--mocha-400)',
          500: 'var(--mocha-500)',
          600: 'var(--mocha-600)',
          700: 'var(--mocha-700)',
          800: 'var(--mocha-800)',
          900: 'var(--mocha-900)',
          950: 'var(--mocha-950)',
        },

        three: {
          bg: 'var(--three-bg)',
          grid: 'var(--three-grid)',
          axis: {
            x: 'var(--three-axis-x)',
            y: 'var(--three-axis-y)',
            z: 'var(--three-axis-z)',
          },
          mesh: 'var(--three-mesh)',
          toolpath: 'var(--three-toolpath)',
          travel: 'var(--three-travel)',
        },

        accent: "var(--color-accent)",
      }
    }

  },
  plugins: [],
}

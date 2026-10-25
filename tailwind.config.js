/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Solo Leveling inspired palette
        bg: {
          primary: '#0A0A1A',
          secondary: '#12122A',
          tertiary: '#1A1A3A',
          card: '#16163A',
        },
        accent: {
          purple: '#4F46E5',
          'purple-light': '#6366F1',
          blue: '#3B82F6',
          'blue-glow': '#60A5FA',
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
          red: '#EF4444',
          emerald: '#10B981',
        },
        neon: {
          cyan: '#00f0ff',
          purple: '#a855f7',
          blue: '#3b82f6',
        },
        rank: {
          e: '#9CA3AF',
          d: '#6EE7B7',
          c: '#60A5FA',
          b: '#A78BFA',
          a: '#F59E0B',
          s: '#F97316',
          ss: '#EF4444',
          sss: '#EC4899',
          national: '#8B5CF6',
          world: '#06B6D4',
          monarch: '#FFD700',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        heading: ['Inter', 'system-ui'],
      },
    },
  },
  plugins: [],
};

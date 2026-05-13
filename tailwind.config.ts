/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36adf8',
          500: '#0c93e9',
          600: '#0074c7',
          700: '#015da1',
          800: '#064f85',
          900: '#0b426e',
          950: '#072a49',
        },
        accent: {
          orange: '#FF6B35',
          green: '#00C853',
          red: '#FF3D57',
          purple: '#7C4DFF',
          yellow: '#FFD600',
        },
        surface: {
          DEFAULT: '#0A0A0F',
          card: '#12121A',
          elevated: '#1A1A25',
          border: '#2A2A3A',
          hover: '#22222F',
        },
        text: {
          primary: '#F5F5F7',
          secondary: '#8E8EA0',
          tertiary: '#5A5A6E',
        },
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(12, 147, 233, 0.3)',
        'glow-lg': '0 0 40px rgba(12, 147, 233, 0.4)',
        card: '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':
          'radial-gradient(at 40% 20%, rgba(12, 147, 233, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(124, 77, 255, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(255, 107, 53, 0.04) 0px, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(12, 147, 233, 0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(12, 147, 233, 0.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

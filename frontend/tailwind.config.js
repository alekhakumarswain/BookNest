/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0F172A', // Deep Slate
          surface: '#1E293B',    // Sleek Dark Slate Surface
          elevated: '#334155',   // Slate Accent
        },
        amber: {
          brand: '#F59E0B',    // Warm Amber Gold
          hover: '#D97706',    // Deep Gold
          light: '#FDE68A',
        },
        status: {
          finished: '#10B981',  // Emerald Green
          reading: '#3B82F6',   // Electric Blue
          wantToRead: '#8B5CF6',// Vibrant Purple
          lent: '#EC4899',      // Warm Rose
        },
        slateText: {
          primary: '#F8FAFC',   // Pure Slate White
          secondary: '#94A3B8', // Muted Slate Grey
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

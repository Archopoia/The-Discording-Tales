/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Parchment Colors
        parchment: {
          bg: '#9c8e72',
          light: '#fffaec',
          aged: '#ecd7a8',
          sublight: '#fff5d3',
          dark: '#d4c4a8',
        },
        // Text Colors
        text: {
          dark: '#4d3000',
          secondary: '#72522f',
          cream: '#F3E2A9',
          light: '#fff6df',
        },
        // Theme Colors
        red: {
          theme: '#643030',
          'theme-alpha': '#643030b9',
        },
        yellow: {
          theme: '#776c48',
          'theme-alpha': '#776c48b9',
        },
        green: {
          theme: '#567251',
          'theme-alpha': '#567251b9',
        },
        teal: {
          theme: '#517c78',
          'theme-alpha': '#517c78b9',
        },
        purple: {
          theme: '#877589',
          'theme-alpha': '#877589b9',
        },
        orange: {
          theme: '#B8915D',
          'theme-alpha': '#B8915Db9',
        },
        // Borders & Shadows
        border: {
          tan: '#ceb68d',
          brown: '#a18b64',
          dark: '#674B1B',
        },
        shadow: {
          dark: '#574b35',
          darker: '#493f2e',
        },
        // Interactive States
        hover: {
          bg: '#fff6df',
        },
        active: {
          bg: '#dfc79d',
        },
        disabled: {
          bg: '#998663',
        },
        focus: {
          glow: '#eacb66',
        },
        // Highlight Colors
        gold: {
          glow: '#ffebc6',
        },
        jade: {
          grid: '#78c9a3',
        },
        // Ink Colors
        ink: {
          dark: '#421212',
          brown: '#3d1f1f',
        },
      },
      fontFamily: {
        medieval: ['Quintessential', 'cursive'],
        title: ['Cinzel', 'serif'],
      },
      boxShadow: {
        'medieval': '0 0 0 1px #643030, 0 0 0 3px #ffebc6, 0 0 0 4px #643030, 0 0 15px 5px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.3)',
        'medieval-inset': '0 0 0 1px #ceb68d, inset 0 0 0 1px #ceb68d',
        'medieval-card': '0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 0 1px #ceb68d',
        'medieval-glow': '0 0 10px 4px #ffebc6, 0 4px 8px rgba(0, 0, 0, 0.2)',
        'medieval-header': 'inset 0 0 0 2px #ceb68d',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'swing-in': 'swingInTopFwd 0.5s cubic-bezier(0.175, 0.885, 0.320, 1.275) both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        swingInTopFwd: {
          '0%': { transform: 'rotateX(-70deg)', opacity: '0' },
          '100%': { transform: 'rotateX(0deg)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

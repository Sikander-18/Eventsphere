export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Afacad Flux"', '"Segoe UI"', 'sans-serif']
      },
      colors: {
        ink: '#151515',
        paper: '#f6f1e8',
        copper: '#c9683f',
        signal: '#d7ff52',
        harbor: '#0e7c7b',
        denim: '#315a80'
      },
      boxShadow: {
        hard: '8px 8px 0 #151515',
        soft: '0 18px 60px rgba(21,21,21,0.16)'
      }
    }
  },
  plugins: []
};


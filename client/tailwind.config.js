/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        'dna-deep': '#0F172A',
        'dna-emerald': '#10B981',
        'dna-cyan': '#06B6D4',
        'dna-slate': '#1E293B',
      },
      backgroundImage: {
        'forest-bg': "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=2560')",
      },
    },
  },
  plugins: [],
}

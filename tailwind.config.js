/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			// Custom design system for Bench
			colors: {
				// Primary brand colors
				brand: {
					50: '#f0fdf4',
					100: '#dcfce7',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d'
				},
				// Semantic colors for betting
				yes: {
					light: '#dcfce7',
					DEFAULT: '#22c55e',
					dark: '#16a34a'
				},
				no: {
					light: '#fee2e2',
					DEFAULT: '#ef4444',
					dark: '#dc2626'
				},
				// Neutral grays for cards and backgrounds
				surface: {
					50: '#fafafa',
					100: '#f5f5f5',
					200: '#e5e5e5',
					300: '#d4d4d4',
					400: '#a3a3a3',
					500: '#737373',
					600: '#525252',
					700: '#404040',
					800: '#262626',
					900: '#171717'
				}
			},
			// Consistent border radius
			borderRadius: {
				card: '1rem',
				button: '9999px'
			},
			// Typography
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
			},
			// Shadows for depth
			boxShadow: {
				card: '0 2px 8px rgba(0, 0, 0, 0.06)',
				'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)'
			}
		}
	},
	plugins: []
};



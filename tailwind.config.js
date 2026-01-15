/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		colors: {
  			// Gogh Lab - Cores Principais
  			gogh: {
  				yellow: '#F7C948',
  				'yellow-dark': '#E5A800',
  				'yellow-light': '#FDE68A',
  				black: '#0A0A0A',
  				'gray-dark': '#1A1A1A',
  				gray: '#2A2A2A',
  				beige: '#F5F1E8',
  				'beige-light': '#FBF8F3',
  				white: '#FFFFFF',
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				light: '#1a1a1a',
  				dark: '#000000',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				dark: '#f5f5f5',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				light: '#FDE68A',
  				dark: '#E5A800',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-geist-sans)',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'var(--font-geist-mono)',
  				'monospace'
  			]
  		},
		animation: {
			'fade-in': 'fadeIn 0.5s ease-in-out',
			'fade-in-up': 'fadeInUp 0.6s ease-out',
			'slide-in': 'slideIn 0.4s ease-out',
			'scale-in': 'scaleIn 0.3s ease-out',
			'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
			'star-movement-top': 'star-movement-top linear infinite alternate',
			'first': 'first 8s ease-in-out infinite',
			'second': 'second 8s ease-in-out infinite',
			'third': 'third 8s ease-in-out infinite',
			'fourth': 'fourth 8s ease-in-out infinite',
			'fifth': 'fifth 8s ease-in-out infinite',
			'diamond-rotate': 'diamond-rotate 3s linear infinite'
		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			fadeInUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(20px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideIn: {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.9)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			'star-movement-bottom': {
  				'0%': { transform: 'translate(0%, 0%)', opacity: '1' },
  				'100%': { transform: 'translate(-100%, 0%)', opacity: '0' }
  			},
			'star-movement-top': {
				'0%': { transform: 'translate(0%, 0%)', opacity: '1' },
				'100%': { transform: 'translate(100%, 0%)', opacity: '0' }
			},
			'first': {
				'0%': { transform: 'translate(0px, 0px) scale(1)' },
				'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
				'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
				'100%': { transform: 'translate(0px, 0px) scale(1)' }
			},
			'second': {
				'0%': { transform: 'translate(0px, 0px) scale(1)' },
				'33%': { transform: 'translate(-30px, 50px) scale(1.1)' },
				'66%': { transform: 'translate(20px, -20px) scale(0.9)' },
				'100%': { transform: 'translate(0px, 0px) scale(1)' }
			},
			'third': {
				'0%': { transform: 'translate(0px, 0px) scale(1)' },
				'33%': { transform: 'translate(50px, 30px) scale(1.1)' },
				'66%': { transform: 'translate(-50px, -30px) scale(0.9)' },
				'100%': { transform: 'translate(0px, 0px) scale(1)' }
			},
			'fourth': {
				'0%': { transform: 'translate(0px, 0px) scale(1)' },
				'33%': { transform: 'translate(-50px, -30px) scale(1.1)' },
				'66%': { transform: 'translate(50px, 30px) scale(0.9)' },
				'100%': { transform: 'translate(0px, 0px) scale(1)' }
			},
			'fifth': {
				'0%': { transform: 'translate(0px, 0px) scale(1)' },
				'33%': { transform: 'translate(30px, 50px) scale(1.1)' },
				'66%': { transform: 'translate(-30px, -50px) scale(0.9)' },
				'100%': { transform: 'translate(0px, 0px) scale(1)' }
			},
			'diamond-rotate': {
				'0%': { transform: 'rotate(0deg)' },
				'100%': { transform: 'rotate(360deg)' }
			}
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}


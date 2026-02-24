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
				'color-1': 'hsl(var(--color-1))',
				'color-2': 'hsl(var(--color-2))',
				'color-3': 'hsl(var(--color-3))',
				'color-4': 'hsl(var(--color-4))',
				'color-5': 'hsl(var(--color-5))',
				// Paleta Gogh Lab
				gogh: {
					yellow: '#F7C948',      // Amarelo girassol (cor principal)
					'yellow-light': '#FFD966',
					'yellow-dark': '#E5A800',
					black: '#0A0A0A',       // Preto (contraste)
					'gray-dark': '#1A1A1A',
					beige: '#F5F1E8',       // Bege (fundos)
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
					DEFAULT: '#F7C948', // Amarelo girassol como accent
					light: '#FFD966',
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
                        'diamond-rotate': 'diamond-rotate 3s linear infinite',
                        'loader-anim': 'loaderAnim 2.5s infinite',
                        'loader-anim-delayed': 'loaderAnim 2.5s -1.25s infinite',
                        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
                        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
                        'rainbow': 'rainbow var(--speed, 2s) infinite linear',
                        'star-btn': 'star-btn calc(var(--duration) * 1s) linear infinite'
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
                        },
                        loaderAnim: {
                                '0%': { inset: '0 35px 35px 0' },
                                '12.5%': { inset: '0 35px 0 0' },
                                '25%': { inset: '35px 35px 0 0' },
                                '37.5%': { inset: '35px 0 0 0' },
                                '50%': { inset: '35px 0 0 35px' },
                                '62.5%': { inset: '0 0 0 35px' },
                                '75%': { inset: '0 0 35px 35px' },
                                '87.5%': { inset: '0 0 35px 0' },
                                '100%': { inset: '0 35px 35px 0' }
                        },
                        'spin-around': {
                                '0%': { transform: 'translateZ(0) rotate(0)' },
                                '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
                                '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
                                '100%': { transform: 'translateZ(0) rotate(360deg)' }
                        },
                        'shimmer-slide': {
                                to: { transform: 'translate(calc(100cqw - 100%), 0)' }
                        },
                        rainbow: {
                                '0%': { 'background-position': '0%' },
                                '100%': { 'background-position': '200%' }
                        },
                        'star-btn': {
                                '0%': { 'offset-distance': '0%' },
                                '100%': { 'offset-distance': '100%' }
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

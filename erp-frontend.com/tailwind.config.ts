import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Roboto', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
			},
			fontSize: {
				xs: 'var(--text-xs)',
				sm: 'var(--text-sm)',
				base: 'var(--text-base)',
				lg: 'var(--text-lg)',
				xl: 'var(--text-xl)',
				'2xl': 'var(--text-2xl)',
				'3xl': 'var(--text-3xl)',
				'4xl': 'var(--text-4xl)',
				'5xl': 'var(--text-5xl)',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				header: {
					from: 'hsl(var(--header-from))',
					to: 'hsl(var(--header-to))',
					border: 'hsl(var(--header-border))',
					text: 'hsl(var(--header-text))',
					muted: 'hsl(var(--header-text-muted))',
					chip: 'hsl(var(--header-chip-bg))',
					'chip-border': 'hsl(var(--header-chip-border))',
					'chip-hover': 'hsl(var(--header-chip-hover))',
				},
				brand: {
					blue: {
						DEFAULT: 'hsl(var(--brand-blue))',
						hover: 'hsl(var(--brand-blue-hover))',
						active: 'hsl(var(--brand-blue-active))',
					},
					orange: {
						DEFAULT: 'hsl(var(--brand-orange))',
						hover: 'hsl(var(--brand-orange-hover))',
					},
				},
				'primary-dark': 'hsl(var(--primary-dark))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glow: 'hsl(var(--primary-glow))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					hover: 'hsl(var(--success-hover))'
				},
				'toast-success': {
					background: 'hsl(var(--toast-success-background))',
					border: 'hsl(var(--toast-success-border))',
					foreground: 'hsl(var(--toast-success-foreground))'
				},
				'toast-error': {
					background: 'hsl(var(--toast-error-background))',
					border: 'hsl(var(--toast-error-border))',
					foreground: 'hsl(var(--toast-error-foreground))'
				},
				'toast-warning': {
					background: 'hsl(var(--toast-warning-background))',
					border: 'hsl(var(--toast-warning-border))',
					foreground: 'hsl(var(--toast-warning-foreground))'
				},
				'toast-info': {
					background: 'hsl(var(--toast-info-background))',
					border: 'hsl(var(--toast-info-border))',
					foreground: 'hsl(var(--toast-info-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				'button-disabled': {
					DEFAULT: 'hsl(var(--button-disabled))',
					foreground: 'hsl(var(--button-disabled-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
					'active-bg': 'hsl(var(--sidebar-active-bg))',
					'active-text': 'hsl(var(--sidebar-active-text))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;

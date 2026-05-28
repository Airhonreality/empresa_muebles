/**
 * AGNOSTIC SEED — TAILWIND CONFIG (Seed Layer)
 * =============================================
 * Todas las referencias de color apuntan a var(--sat-*).
 * El satélite sólo necesita overridear esas variables CSS
 * en storage/[tenant]/styles/tokens.css para rebranding total.
 *
 * NUNCA pongas valores hardcoded aquí. Si necesitas un color
 * nuevo, primero define el token en globals.css y aquí.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
  	extend: {
  		colors: {
  			background: 'var(--sat-bg)',
  			foreground: 'var(--sat-fg)',
  			border: 'var(--sat-border)',
  			input: 'var(--sat-input)',
  			ring: 'var(--sat-ring)',
  			card: {
  				DEFAULT: 'var(--sat-card)',
  				foreground: 'var(--sat-card-fg)'
  			},
  			popover: {
  				DEFAULT: 'var(--sat-card)',
  				foreground: 'var(--sat-card-fg)'
  			},
  			primary: {
  				DEFAULT: 'var(--sat-accent)',
  				foreground: 'var(--sat-accent-fg)'
  			},
  			secondary: {
  				DEFAULT: 'var(--sat-muted)',
  				foreground: 'var(--sat-fg)'
  			},
  			muted: {
  				DEFAULT: 'var(--sat-muted)',
  				foreground: 'var(--sat-muted-fg)'
  			},
  			accent: {
  				DEFAULT: 'var(--sat-muted)',
  				foreground: 'var(--sat-fg)'
  			},
  			destructive: {
  				DEFAULT: 'var(--sat-destructive)',
  				foreground: 'var(--sat-destructive-fg)'
  			}
  		},
  		borderRadius: {
  			sm: 'calc(var(--sat-radius) + 2px)',
  			DEFAULT: 'calc(var(--sat-radius) + 4px)',
  			md: 'calc(var(--sat-radius) + 6px)',
  			lg: 'calc(var(--sat-radius) + 8px)',
  			xl: 'calc(var(--sat-radius) + 12px)',
  			'2xl': 'calc(var(--sat-radius) + 20px)',
  			'3xl': 'calc(var(--sat-radius) + 32px)'
  		},
  		fontFamily: {
  			sans: [
  				'var(--sat-font-sans)'
  			],
  			serif: [
  				'var(--sat-font-serif)'
  			],
  			mono: [
  				'var(--sat-font-mono)'
  			]
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

  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries")
  ],
};

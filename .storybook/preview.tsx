import { ThemeProvider } from 'next-themes'
import React from 'react'
import '../src/app/globals.css'

/**
 * Preview configuration para Storybook
 * 
 * Nota: Archivo .tsx porque contiene JSX en los decoradores.
 * @storybook/nextjs ya incluye toda la funcionalidad necesaria.
 * 
 * Integraciones:
 * - TailwindCSS: importa globals.css que contiene @tailwind directives y CSS variables
 * - next-themes: ThemeProvider para soporte de dark mode
 * - Radix UI: funciona sin configuración adicional (usa CSS variables de Tailwind)
 */
const preview = {
  parameters: {
    // Controles para todas las props
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Backgrounds para probar componentes en diferentes fondos
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'hsl(0 0% 100%)', // --background light
        },
        {
          name: 'dark',
          value: 'hsl(222.2 84% 4.9%)', // --background dark
        },
      ],
    },
    // Actions para eventos
    actions: { argTypesRegex: '^on[A-Z].*' },
  },
  // Decoradores globales: envolver todas las stories con providers necesarios
  decorators: [
    (Story) => {
      // ThemeProvider de next-themes para soporte de dark mode
      // Nota: En Storybook, el theme se controla desde el toolbar, no desde el sistema
      return (
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background text-foreground">
            <Story />
          </div>
        </ThemeProvider>
      )
    },
  ],
}

export default preview


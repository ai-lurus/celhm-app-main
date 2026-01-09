import type { StorybookConfig } from '@storybook/nextjs'

/**
 * Configuración principal de Storybook para Next.js 15
 * 
 * CAUSA RAÍZ del error "Cannot read properties of undefined (reading 'tap')":
 * - Teníamos @storybook/react Y @storybook/nextjs instalados simultáneamente
 * - Ambos frameworks intentan configurar Webpack, creando conflictos en los hooks (tap)
 * - @storybook/react registra sus propios plugins de Webpack que colisionan con los de Next.js
 * 
 * SOLUCIÓN:
 * 1. Usar SOLO @storybook/nextjs (elimina @storybook/react completamente)
 * 2. @storybook/nextjs ya incluye todo lo necesario de React + Next.js
 * 3. NO tocar Webpack manualmente - el preset lo maneja internamente
 * 4. NO modificar config.plugins - el preset configura los hooks correctamente
 * 5. Versiones exactas (sin ^) para evitar drift que cause conflictos
 */
const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {
      // El preset de Next.js maneja automáticamente:
      // - Webpack 5 con hooks correctamente configurados (sin conflictos de tap)
      // - Transpilación de paquetes workspace
      // - Resolución de módulos de Next.js
      // - Soporte para App Router
      nextConfigPath: '../next.config.js',
    },
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
}

export default config

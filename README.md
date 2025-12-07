# CELHM Web Application

Aplicación web frontend para el sistema CELHM - Sistema de Gestión para Talleres de Reparación de Celulares.

## 🏗️ Estructura del Proyecto

Este es un monorepo que contiene:

- **Raíz** - Aplicación Next.js (frontend)
- **`packages/types/`** - Tipos TypeScript compartidos
- **`packages/ui/`** - Componentes UI compartidos
- **`packages/config/`** - Configuraciones compartidas (ESLint, TypeScript, Prettier)

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Instalación

```bash
pnpm install
```

### Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en http://localhost:3000

**Nota:** Asegúrate de que la API backend esté corriendo en `http://localhost:3001` (ver `celhm-api-main`)

### Build

```bash
pnpm build
```

### Tests

```bash
# Tests unitarios
pnpm test

# Tests E2E
pnpm test:e2e
```

## 📦 Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye la aplicación para producción
- `pnpm start` - Inicia el servidor de producción
- `pnpm test` - Ejecuta tests unitarios
- `pnpm test:e2e` - Ejecuta tests E2E con Playwright
- `pnpm typecheck` - Verifica tipos TypeScript
- `pnpm lint` - Ejecuta el linter
- `pnpm lint:fix` - Corrige errores de linting
- `pnpm format` - Formatea el código con Prettier

## 🔗 API Backend

La aplicación web se conecta a la API backend que debe estar corriendo en:

- **Desarrollo:** http://localhost:3001
- **Producción:** Configurar mediante `NEXT_PUBLIC_API_URL`

## 📁 Estructura de Directorios

```
celhm-app-main/
├── src/                  # Código fuente de la aplicación
│   ├── app/              # Páginas y layouts (App Router)
│   ├── components/       # Componentes React
│   ├── lib/              # Utilidades y hooks
│   └── stores/           # Estado global (Zustand)
├── packages/
│   ├── types/            # Tipos TypeScript compartidos
│   ├── ui/               # Componentes UI compartidos
│   └── config/           # Configuraciones compartidas
├── tests/
│   └── e2e/              # Tests E2E con Playwright
├── package.json
└── pnpm-workspace.yaml
```

## 🔐 Autenticación

La aplicación usa JWT para autenticación. Las credenciales se gestionan a través del backend API.

## 🛠️ Tecnologías

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS, Radix UI
- **Estado:** Zustand
- **HTTP Client:** Axios
- **Testing:** Jest, Playwright
- **TypeScript:** 5.3+

## 📝 Notas

- Este repositorio contiene solo la aplicación web frontend
- El backend API está en un repositorio separado: `celhm-api-main`
- Los tipos TypeScript se comparten a través del package `@celhm/types`

# CELHM Web Application

Aplicación web frontend para el sistema CELHM - Sistema de Gestión para Talleres de Reparación de Celulares.

## 🏗️ Estructura del Proyecto

Este es un monorepo que contiene:

- **Raíz** - Aplicación Next.js (frontend)
- **`packages/types/`** - Tipos TypeScript compartidos
- **`packages/ui/`** - Componentes UI compartidos
- **`packages/config/`** - Configuraciones compartidas (ESLint, TypeScript, Prettier)

## 📋 Instalación Local

### Prerequisitos

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Backend API corriendo** en puerto 3001 (ver [celhm-api-main](../celhm-api-main/README.md))

### Paso 1: Instalar Dependencias

```bash
pnpm install
```

### Paso 2: Ejecutar

No es necesario configurar variables de entorno si el backend corre en el puerto 3001 (default).

```bash
pnpm dev
```

La aplicación estará disponible en http://localhost:3000

> **Nota**: Si tu backend corre en un puerto diferente a 3001, crea un archivo `.env.local` con:
> ```env
> NEXT_PUBLIC_API_URL=http://localhost:PUERTO
> ```



La aplicación estará disponible en http://localhost:3000

**Nota:** Asegúrate de que el backend API esté corriendo en `http://localhost:3001`. Para configurar el backend, consulta el [README del backend](../celhm-api-main/README.md).

## 🚀 Inicio Rápido

Si ya tienes todo configurado:

```bash
pnpm dev
```

La aplicación estará disponible en http://localhost:3000

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

### Tecnologías del Backend

El backend usa:
- **Framework:** NestJS
- **Base de datos:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Autenticación:** JWT
- **Documentación:** Swagger (disponible en http://localhost:3001/docs)

Para más información sobre el backend, consulta el [README del backend](../celhm-api-main/README.md).

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

## 🐛 Solución de Problemas

### Error: "Can't reach database server"

Este error es del backend. Consulta el [README del backend](../celhm-api-main/README.md) y [TROUBLESHOOTING_DB.md](../celhm-api-main/TROUBLESHOOTING_DB.md) para solucionarlo.


### Error: "API connection failed" en el frontend

1. Verifica que el backend esté corriendo en http://localhost:3001
2. Verifica que `NEXT_PUBLIC_API_URL` en `.env.local` sea correcto
3. Revisa la consola del navegador para ver el error específico

## 📝 Notas

- Este repositorio contiene solo la aplicación web frontend
- El backend API está en un repositorio separado: `celhm-api-main`
- Los tipos TypeScript se comparten a través del package `@celhm/types`
- Para configurar el backend, consulta el [README del backend](../celhm-api-main/README.md)

# Guía de Contribución - Frontend CELHM

¡Gracias por tu interés en contribuir al frontend de CELHM! Esta guía te ayudará a entender cómo contribuir de manera efectiva.

## Código de Conducta

Este proyecto sigue un código de conducta para asegurar un ambiente colaborativo y respetuoso. Al participar, te comprometes a mantener este código.

## Proceso de Contribución

### 1. Configuración del Entorno

#### Prerrequisitos
- Node.js 18+
- pnpm 8+
- Git
- Editor de código (VS Code recomendado)

#### Configuración Inicial
```bash
# Clonar el repositorio
git clone <repository-url>
cd celhm-app-main

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp env.example .env.local
# Editar .env.local con NEXT_PUBLIC_API_URL

# Ejecutar en modo desarrollo
pnpm dev
```

### 2. Flujo de Trabajo

#### Branches
- `main`: Código de producción
- `develop`: Código de desarrollo
- `feature/*`: Nuevas funcionalidades
- `bugfix/*`: Correcciones de bugs

#### Proceso
1. Crear branch desde `develop`
2. Hacer cambios
3. Ejecutar tests: `pnpm test`
4. Ejecutar lint: `pnpm lint`
5. Crear Pull Request

### 3. Estándares de Código

#### TypeScript
- Usar tipos explícitos
- Evitar `any`
- Usar interfaces para objetos complejos

#### React
- Usar componentes funcionales
- Hooks para estado y efectos
- Props tipadas con TypeScript

#### Estilos
- Tailwind CSS para estilos
- Componentes de `@celhm/ui` cuando sea posible
- Responsive design

### 4. Testing

#### Tests Unitarios
```bash
pnpm test
```

#### Tests E2E
```bash
pnpm test:e2e
```

### 5. Commits

Usar mensajes descriptivos:
```
feat: agregar página de tickets
fix: corregir error en login
docs: actualizar README
```

## Estructura de Archivos

- `src/app/`: Páginas (App Router)
- `src/components/`: Componentes React
- `src/lib/`: Utilidades y hooks
- `src/stores/`: Estado global (Zustand)
- `packages/types/`: Tipos TypeScript compartidos
- `packages/ui/`: Componentes UI compartidos

## Preguntas

Si tienes preguntas, abre un issue en el repositorio.

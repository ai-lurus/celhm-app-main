# Guía de Deploy

## Variables de Entorno

### API (NestJS) - Configurar en Vercel

#### Requeridas:
- `DATABASE_URL`: URL de conexión a PostgreSQL (Supabase)
  ```
  DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
  ```
- `JWT_SECRET`: Secreto para firmar tokens JWT (debe ser fuerte y único)
  ```
  # Generar uno seguro:
  openssl rand -base64 32
  ```

#### Opcionales:
- `CORS_ORIGINS`: URLs permitidas para CORS separadas por comas (ej: `https://app.vercel.app,https://www.domain.com`)
- `API_PORT`: Puerto donde corre la API (Vercel lo asigna automáticamente)
- `SHADOW_DATABASE_URL`: URL de base de datos shadow para migraciones (opcional)
- `REDIS_HOST`: Host de Redis para Bull queues (default: localhost)
- `REDIS_PORT`: Puerto de Redis (default: 6379)
- `REDIS_PASSWORD`: Contraseña de Redis (opcional)
- `NODE_ENV`: Entorno de ejecución (production/development)

### Web (Next.js) - Configurar en Vercel

#### Requeridas:
- `NEXT_PUBLIC_API_URL`: URL completa de la API en producción
  ```
  NEXT_PUBLIC_API_URL="https://your-api.vercel.app"
  ```

#### Opcionales:
- `NEXT_PUBLIC_ENABLE_MOCKS`: Habilitar modo mock (solo desarrollo, default: false)

## Deploy en Vercel

### API

1. **Crear proyecto en Vercel:**
   - Conecta el repositorio
   - Selecciona el directorio `apps/api`
   - Framework Preset: **Other**

2. **Configurar Build Settings:**
   ```
   Build Command: (ya configurado en vercel.json)
   Output Directory: apps/api/dist
   Install Command: pnpm install
   ```
   
   **Nota:** El `vercel.json` ya incluye el build command que:
   - Instala dependencias
   - Genera Prisma Client desde `prisma/schema.prisma`
   - Construye @celhm/types
   - Construye la API

3. **Variables de Entorno:**
   - `DATABASE_URL`: Tu conexión a Supabase
   - `JWT_SECRET`: Genera uno seguro (puedes usar: `openssl rand -base64 32`)
   - `CORS_ORIGINS`: URLs permitidas separadas por comas (ej: `https://your-web.vercel.app`)
   - `NODE_ENV`: `production`
   - `API_PORT`: `3001` (o el puerto que Vercel asigne)

4. **Configurar vercel.json:**
   El archivo `apps/api/vercel.json` ya está configurado para serverless functions.

### Web

1. **Crear proyecto en Vercel:**
   - Conecta el mismo repositorio
   - Selecciona el directorio `apps/web`
   - Framework Preset: **Next.js**

2. **Configurar Build Settings:**
   ```
   Build Command: pnpm install && pnpm --filter @celhm/types build && pnpm --filter @celhm/web build
   Output Directory: apps/web/.next
   Install Command: pnpm install
   ```

3. **Variables de Entorno:**
   - `NEXT_PUBLIC_API_URL`: URL de tu API desplegada
     ```
     NEXT_PUBLIC_API_URL="https://celhm-app-main-api.vercel.app"
     ```
   - `NODE_ENV`: `production`

## Paquete @celhm/types

El paquete `@celhm/types` se mantiene automáticamente porque:

1. **Está configurado como workspace dependency:**
   - En `apps/web/package.json`: `"@celhm/types": "workspace:*"`
   - En `apps/api/package.json`: (si se usa, también como workspace)

2. **Se construye antes del build:**
   - El script de build de web incluye: `pnpm --filter @celhm/types build`
   - Esto genera los tipos en `packages/types/dist/`

3. **En Vercel:**
   - Asegúrate de que el build command incluya `pnpm --filter @celhm/types build`
   - Los tipos se compilan y están disponibles para web y api

## Verificación Post-Deploy

### API:
- ✅ Verifica que la API responda: `https://celhm-app-main-api.vercel.app/health`
- ✅ Verifica Swagger: `https://celhm-app-main-api.vercel.app/docs`
- ✅ Prueba login: `POST https://celhm-app-main-api.vercel.app/auth/login`

### Web:
- ✅ Verifica que la app cargue
- ✅ Verifica que pueda conectarse a la API
- ✅ Prueba login desde la UI

## Notas Importantes

1. **CORS:** Configura la variable de entorno `CORS_ORIGINS` en Vercel (proyecto API) con las URLs permitidas separadas por comas:
   ```
   CORS_ORIGINS="https://your-web-app.vercel.app,https://www.your-domain.com"
   ```
   Si no se configura, por defecto usa `https://celhm-app.vercel.app` en producción.
   
   **Nota:** Una vez que tengas la URL de tu web app desplegada, actualiza `CORS_ORIGINS` en el proyecto API de Vercel.

2. **JWT_SECRET:** 
   - Debe ser el mismo en todos los ambientes (dev, staging, production)
   - Genera uno seguro: `openssl rand -base64 32`
   - Nunca lo commitees al repositorio

3. **DATABASE_URL:**
   - Usa connection pooling en producción
   - Supabase proporciona una URL con pooling automático

4. **Types:**
   - Los tipos se compilan automáticamente en el build
   - Si cambias tipos, ambos proyectos (web y api) se reconstruyen
   - No necesitas deployar el paquete types por separado


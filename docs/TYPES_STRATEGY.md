# Estrategia para @celhm/types

## Situación Actual

El paquete `@celhm/types` es un workspace package que se construye durante el build del proyecto web.

**Uso:**
- ✅ **Web:** Usa `@celhm/types` para tipos compartidos (Product, Ticket, Stock, etc.)
- ❌ **API:** NO usa `@celhm/types`, usa directamente `@prisma/client` para tipos de base de datos

**Problema:** En Vercel con instancias separadas, el build de web necesita construir los types.

## Opciones para Mejorar

### Opción 1: Publicar a npm (Recomendado para Producción)

**Ventajas:**
- ✅ Una sola fuente de verdad
- ✅ Versionado semántico
- ✅ No necesita construirse en cada deploy
- ✅ Funciona con cualquier CI/CD

**Desventajas:**
- ⚠️ Requiere cuenta npm (gratis para paquetes públicos)
- ⚠️ Necesita publicar manualmente o con CI

**Implementación:**
```json
// packages/types/package.json
{
  "name": "@celhm/types",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public" // o "restricted" para privado
  }
}
```

Luego en web/api:
```json
{
  "dependencies": {
    "@celhm/types": "^1.0.0"
  }
}
```

### Opción 2: GitHub Packages (Privado)

**Ventajas:**
- ✅ Privado por defecto
- ✅ Integrado con GitHub
- ✅ Versionado

**Desventajas:**
- ⚠️ Requiere configuración de autenticación
- ⚠️ Más complejo de configurar

### Opción 3: Mantener Workspace (Actual - Recomendado)

**Ventajas:**
- ✅ Funciona localmente sin publicar
- ✅ Cambios inmediatos sin versionar
- ✅ No requiere npm/GitHub Packages
- ✅ Solo se construye en web (donde se usa)
- ✅ API no necesita construirlo (no lo usa)

**Desventajas:**
- ⚠️ Necesita construirse en cada build de web
- ⚠️ Requiere que el workspace esté completo en Vercel

**Implementación Actual:**
- ✅ Ya está configurado para construirse antes del build de web
- ✅ API no lo construye (optimización)
- ✅ Funciona bien si el workspace está completo

## Recomendación

**Para Desarrollo:** Mantener como workspace (Opción 3) - ✅ Ya implementado

**Para Producción:** Considerar publicar a npm (Opción 1) cuando el proyecto esté más estable

## Implementación Actual (Workspace)

El build command incluye la construcción de types solo donde se necesita:
- **API:** NO construye types (no los usa)
- **Web:** `pnpm --filter @celhm/types build && pnpm build`

Esto funciona porque:
1. El workspace incluye `packages/types`
2. Se construye antes del build de web
3. Los tipos compilados están en `packages/types/dist/`
4. Se importan como `@celhm/types` usando `workspace:*`
5. Next.js transpila el paquete automáticamente (configurado en `next.config.js`)

## Si Quieres Publicar a npm

1. **Crear cuenta npm** (si no tienes)
2. **Configurar package.json:**
   ```json
   {
     "name": "@celhm/types",
     "version": "1.0.0",
     "publishConfig": {
       "access": "public"
     }
   }
   ```
3. **Publicar:**
   ```bash
   cd packages/types
   pnpm publish
   ```
4. **Actualizar dependencias en web/api:**
   ```json
   {
     "dependencies": {
       "@celhm/types": "^1.0.0"
     }
   }
   ```
5. **Remover del workspace** (opcional)


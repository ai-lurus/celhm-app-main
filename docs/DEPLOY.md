# Guía de Deploy - Frontend Web

## Variables de Entorno

### Requeridas
- `NEXT_PUBLIC_API_URL`: URL completa de la API backend en producción
  ```
  NEXT_PUBLIC_API_URL="https://your-api.vercel.app"
  ```

### Opcionales
- `NEXT_PUBLIC_ENABLE_MOCKS`: Habilitar modo mock (solo desarrollo, default: false)

## Deploy en Vercel

### Configuración

1. **Conectar repositorio a Vercel:**
   - Conecta el repositorio `celhm-app-main`
   - Framework Preset: **Next.js**

2. **Configurar Variables de Entorno:**
   - `NEXT_PUBLIC_API_URL`: URL de tu API backend

3. **Build Settings:**
   - Build Command: `pnpm build` (automático para Next.js)
   - Output Directory: `.next` (automático)
   - Install Command: `pnpm install`

### Verificación

Después del deploy, verifica:
- ✅ La aplicación carga correctamente
- ✅ Puede conectarse a la API backend
- ✅ El login funciona
- ✅ Las peticiones HTTP funcionan

## Notas

- El backend debe estar desplegado y accesible antes de desplegar el frontend
- Asegúrate de que `NEXT_PUBLIC_API_URL` apunte a la URL correcta de producción
- CORS debe estar configurado en el backend para permitir requests desde el frontend

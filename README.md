# CELHM - Sistema de Inventario y Tickets

SaaS Multi-tenant para inventario por sucursal y tickets de reparación con folios y notificaciones.

## 🚀 Características

- **Multi-tenant**: Soporte para múltiples organizaciones con sucursales independientes
- **Inventario**: Gestión completa de stock con movimientos (ING/EGR/VTA/AJU/TRF)
- **Tickets**: Workflow completo de reparación con estados y piezas
- **Folios**: Generación automática con formato `{PREFIJO}-{SUC}-{YYYYMM}-{SEQ}`
- **Notificaciones**: Email, SMS y WhatsApp con plantillas editables
- **RBAC**: Control de acceso basado en roles (Dirección, Admon, Laboratorio)
- **Auditoría**: Historial completo de cambios con IP y User-Agent
- **Mock Mode**: Funciona sin base de datos para desarrollo y demo

## 🏗️ Arquitectura

### Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, Prisma, PostgreSQL (Supabase)
- **Auth**: Supabase Auth (email/password + magic link)
- **Notificaciones**: Resend (email), Twilio (SMS), Meta Cloud API (WhatsApp)
- **Deploy**: Vercel (web + API serverless)
- **Monorepo**: pnpm workspaces

### Estructura del Proyecto

```
celhm-app/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── ui/           # Design system (shadcn/ui)
│   ├── types/        # Tipos compartidos (Zod)
│   └── config/       # ESLint, Prettier, TSConfig
├── prisma/           # Schema y migraciones
└── docs/             # Documentación
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- pnpm 8+
- PostgreSQL (opcional, funciona con mocks)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd celhm-app
   ```

2. **Instalar dependencias**
   ```bash
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env.local
   # Editar .env.local con tus credenciales
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   pnpm dev
   ```

   Esto iniciará:
   - Frontend en http://localhost:3000
   - API en http://localhost:3001
   - Swagger docs en http://localhost:3001/docs

### Modo Mock (Sin Base de Datos)

El sistema funciona completamente sin base de datos usando datos mock:

```bash
# Asegúrate de que NEXT_PUBLIC_ENABLE_MOCKS=true en .env.local
pnpm dev
```

**Usuarios de prueba:**
- `direccion@acme-repair.com` / `ChangeMe123!` (Dirección)
- `admon@acme-repair.com` / `ChangeMe123!` (Admon)
- `laboratorio@acme-repair.com` / `ChangeMe123!` (Laboratorio)

## 📊 Base de Datos

### Configuración con Supabase

1. **Crear proyecto en Supabase**
2. **Configurar variables de entorno**
   ```env
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
   ```

3. **Ejecutar migraciones**
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

### Schema Multi-tenant

- **Organizations**: Empresas que usan el sistema
- **Branches**: Sucursales por organización
- **Users**: Usuarios con roles y membresías
- **Products/Variants**: Catálogo de productos
- **Stock**: Inventario por sucursal y variante
- **Tickets**: Tickets de reparación con workflow
- **Movements**: Historial de movimientos de inventario
- **Notifications**: Sistema de notificaciones

## 🔐 Seguridad

### RBAC (Role-Based Access Control)

- **DIRECCION**: Admin global, configuración, usuarios
- **ADMON**: Operaciones de inventario y tickets
- **LABORATORIO**: Creación de tickets, reparaciones

### Características de Seguridad

- JWT authentication con Supabase
- Rate limiting por endpoint
- CORS configurado
- Headers de seguridad
- Auditoría de operaciones sensibles
- Validación de entrada con Zod

## 📱 Notificaciones

### Proveedores Soportados

- **Email**: Resend (gratis tier)
- **SMS**: Twilio (comentado, requiere API key)
- **WhatsApp**: Meta Cloud API (comentado, requiere tokens)

### Plantillas

Las plantillas usan MDX con variables:
```mdx
# Estado de Ticket Actualizado

Hola {{customerName}},

Tu ticket **{{folio}}** ha cambiado de estado a **{{state}}**.

**Sucursal:** {{branchName}}
**Fecha:** {{updatedAt}}
```

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conectar repositorio a Vercel**
2. **Configurar variables de entorno**
3. **Deploy automático en push a main**

### Docker

```bash
# Construir imágenes
docker-compose build

# Ejecutar servicios
docker-compose up -d
```

## 🧪 Testing

```bash
# Tests unitarios
pnpm test

# Tests e2e (requiere Playwright)
pnpm test:e2e

# Coverage
pnpm test:cov
```

## 📚 Documentación

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Arquitectura del sistema
- [SECURITY.md](./docs/SECURITY.md) - Políticas de seguridad
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md) - Guía de contribución
- [RUNBOOK.md](./docs/RUNBOOK.md) - Operaciones y mantenimiento
- [ADR/](./docs/ADR/) - Decisiones arquitectónicas

## 🤝 Contribución

Ver [CONTRIBUTING.md](./docs/CONTRIBUTING.md) para detalles sobre:
- Convenciones de código
- Proceso de PR
- Testing
- Deploy

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para detalles.

## 🆘 Soporte

- **Issues**: GitHub Issues
- **Documentación**: `/docs`
- **API Docs**: http://localhost:3001/docs (desarrollo)

---

**Desarrollado con ❤️ para la gestión eficiente de inventarios y reparaciones**

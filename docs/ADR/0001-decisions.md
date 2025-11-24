# ADR-0001: Decisiones Arquitectónicas Principales

**Fecha**: Diciembre 2024  
**Estado**: Aceptado  
**Decisores**: Equipo de Arquitectura  

## Contexto

Durante el diseño inicial del sistema CELHM, se tomaron varias decisiones arquitectónicas críticas que impactan la escalabilidad, mantenibilidad y costo del sistema.

## Decisiones

### 1. Autenticación: Supabase Auth vs Auth0 vs Custom

**Decisión**: Usar Supabase Auth

**Razones**:
- ✅ **Costo**: Tier gratuito generoso (50,000 usuarios activos)
- ✅ **Integración**: Perfecta integración con PostgreSQL
- ✅ **Funcionalidades**: JWT, magic links, social auth
- ✅ **Mantenimiento**: Menos código customizado
- ✅ **Seguridad**: Equipo especializado en seguridad

**Alternativas consideradas**:
- Auth0: Más caro, más funcionalidades
- Custom JWT: Más trabajo, menos seguro

### 2. Base de Datos: Multi-tenant Strategy

**Decisión**: Shared Database, Shared Schema con discriminación por `organizationId`

**Razones**:
- ✅ **Costo**: Una sola instancia de PostgreSQL
- ✅ **Mantenimiento**: Un schema para todos los tenants
- ✅ **Desarrollo**: Más rápido para MVP
- ✅ **Backup/Recovery**: Proceso unificado

**Alternativas consideradas**:
- Database per tenant: Más caro, más complejo
- Schema per tenant: Limitaciones de PostgreSQL

**Implementación**:
```sql
-- Todas las tablas incluyen organizationId
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  -- ... otros campos
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
```

### 3. Notificaciones: Adapters Pattern

**Decisión**: Implementar adapters para diferentes proveedores

**Razones**:
- ✅ **Flexibilidad**: Fácil cambiar proveedores
- ✅ **Costo**: Usar el más barato por canal
- ✅ **Resilencia**: Fallback entre proveedores
- ✅ **Testing**: Mock providers para desarrollo

**Implementación**:
```typescript
interface NotificationProvider {
  send(recipient: string, message: string): Promise<Result>;
}

class EmailProvider implements NotificationProvider {
  // Resend implementation
}

class SmsProvider implements NotificationProvider {
  // Twilio implementation (commented until API key)
}
```

### 4. Deploy: Vercel Serverless vs Docker

**Decisión**: Vercel para web, serverless functions para API

**Razones**:
- ✅ **Simplicidad**: Deploy automático desde Git
- ✅ **Escalabilidad**: Auto-scaling
- ✅ **Costo**: Pay-per-use
- ✅ **Performance**: Edge functions
- ✅ **CI/CD**: Integración nativa

**Alternativas consideradas**:
- Docker + Kubernetes: Más complejo, más control
- AWS Lambda: Más caro, más configuración

### 5. Monorepo: pnpm Workspaces

**Decisión**: Usar pnpm workspaces para monorepo

**Razones**:
- ✅ **Performance**: Más rápido que npm/yarn
- ✅ **Espacio**: Hard links para ahorrar espacio
- ✅ **Dependencias**: Mejor manejo de dependencias compartidas
- ✅ **Scripts**: Scripts coordinados entre packages

**Estructura**:
```
celhm-app/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── ui/           # Design system
│   ├── types/        # Shared types
│   └── config/       # Shared config
```

### 6. Estado Frontend: Zustand vs Redux

**Decisión**: Zustand para estado global

**Razones**:
- ✅ **Simplicidad**: Menos boilerplate
- ✅ **Bundle size**: Más pequeño
- ✅ **TypeScript**: Mejor integración
- ✅ **Learning curve**: Más fácil de aprender

**Alternativas consideradas**:
- Redux Toolkit: Más funcionalidades, más complejo
- Context API: Limitado para estado complejo

### 7. Testing: Jest + Playwright

**Decisión**: Jest para unit/integration, Playwright para e2e

**Razones**:
- ✅ **Jest**: Estándar de la industria, buena integración
- ✅ **Playwright**: Mejor que Cypress para nuestro caso
- ✅ **Coverage**: Cobertura completa
- ✅ **CI/CD**: Integración fácil

### 8. Styling: Tailwind CSS + shadcn/ui

**Decisión**: Tailwind CSS con shadcn/ui components

**Razones**:
- ✅ **Productividad**: Desarrollo más rápido
- ✅ **Consistencia**: Design system predefinido
- ✅ **Customización**: Fácil personalizar
- ✅ **Bundle size**: Solo CSS usado
- ✅ **TypeScript**: Componentes tipados

## Consecuencias

### Positivas
- **Desarrollo rápido**: Menos decisiones de infraestructura
- **Costo bajo**: Servicios gratuitos/tier gratuito
- **Mantenimiento**: Menos código customizado
- **Escalabilidad**: Auto-scaling en Vercel

### Negativas
- **Vendor lock-in**: Dependencia de Supabase y Vercel
- **Limitaciones**: Algunas limitaciones de serverless
- **Complejidad**: Monorepo puede ser complejo inicialmente

### Riesgos
- **Supabase limits**: Límites del tier gratuito
- **Vercel limits**: Límites de serverless functions
- **Multi-tenant**: Aislamiento de datos depende de código

## Mitigaciones

### Vendor Lock-in
- **Abstracciones**: Interfaces para servicios externos
- **Documentación**: Procedimientos de migración
- **Testing**: Tests que no dependan de servicios externos

### Límites de Servicios
- **Monitoring**: Alertas cuando se acerquen los límites
- **Scaling plan**: Plan para upgrade cuando sea necesario
- **Alternatives**: Identificar alternativas viables

### Multi-tenant Security
- **Validation**: Validación estricta de organizationId
- **Testing**: Tests específicos para aislamiento
- **Auditing**: Logs de todas las operaciones

## Estado

- [x] **Propuesto**: Diciembre 2024
- [x] **Discutido**: Equipo de arquitectura
- [x] **Aceptado**: Diciembre 2024
- [ ] **Implementado**: En progreso
- [ ] **Revisado**: Pendiente

## Referencias

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**Próxima revisión**: Marzo 2025  
**Responsable**: Equipo de Arquitectura


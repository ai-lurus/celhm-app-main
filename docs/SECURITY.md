# Política de Seguridad - CELHM

## Resumen Ejecutivo

Este documento describe las políticas, procedimientos y controles de seguridad implementados en el sistema CELHM para proteger los datos de los usuarios y garantizar la integridad del sistema.

## Principios de Seguridad

### 1. Defense in Depth
Múltiples capas de seguridad para proteger contra diferentes tipos de amenazas.

### 2. Principle of Least Privilege
Los usuarios y sistemas tienen acceso solo a los recursos necesarios para sus funciones.

### 3. Zero Trust Architecture
Ninguna entidad es confiable por defecto; toda comunicación debe ser verificada.

### 4. Security by Design
La seguridad está integrada en el diseño del sistema desde el inicio.

## Autenticación y Autorización

### Autenticación

#### Métodos Soportados
- **Email/Password**: Autenticación tradicional con Supabase Auth
- **Magic Links**: Login sin contraseña (futuro)
- **Social Auth**: Google, GitHub (futuro)

#### Controles de Seguridad
```typescript
// Rate limiting en login
@Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Validación y autenticación
}
```

#### Políticas de Contraseñas
- Mínimo 8 caracteres
- Combinación de mayúsculas, minúsculas, números y símbolos
- No reutilización de las últimas 5 contraseñas
- Expiración cada 90 días (configurable por organización)

### Autorización

#### RBAC (Role-Based Access Control)

```typescript
enum Role {
  DIRECCION = 'DIRECCION',    // Admin global
  ADMON = 'ADMON',           // Operaciones
  LABORATORIO = 'LABORATORIO' // Reparaciones
}
```

#### Permisos por Rol

| Funcionalidad | DIRECCION | ADMON | LABORATORIO |
|---------------|-----------|-------|-------------|
| Gestión de usuarios | ✅ | ❌ | ❌ |
| Configuración de organización | ✅ | ❌ | ❌ |
| Gestión de inventario | ✅ | ✅ | ❌ |
| Crear tickets | ✅ | ✅ | ✅ |
| Cambiar estado de tickets | ✅ | ✅ | ⚠️* |
| Ver reportes | ✅ | ✅ | ❌ |

*Solo estados específicos según workflow

#### Multi-tenant Isolation
```typescript
// Todos los queries incluyen organizationId
const tickets = await prisma.ticket.findMany({
  where: {
    organizationId: user.organizationId, // Aislamiento automático
    // ... otros filtros
  }
});
```

## Protección de Datos

### Clasificación de Datos

#### Datos Sensibles
- Credenciales de usuario
- Información personal (PII)
- Datos financieros
- Información de clientes

#### Datos Internos
- Configuraciones del sistema
- Logs de auditoría
- Métricas de performance

#### Datos Públicos
- Información de productos (sin precios)
- Documentación pública

### Encriptación

#### En Tránsito
- **TLS 1.3**: Todas las comunicaciones HTTPS
- **HSTS**: Headers de seguridad estrictos
- **Certificate Pinning**: Validación de certificados

#### En Reposo
- **AES-256**: Encriptación de base de datos
- **Key Management**: Rotación automática de claves
- **Backup Encryption**: Backups encriptados

### Manejo de Secretos

```typescript
// Variables de entorno sensibles
const sensitiveEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'TWILIO_AUTH_TOKEN'
];
```

#### Rotación de Claves
- **JWT Secrets**: Cada 90 días
- **API Keys**: Cada 6 meses
- **Database Passwords**: Cada 12 meses

## Seguridad de la Aplicación

### Validación de Entrada

#### Frontend (Zod)
```typescript
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});
```

#### Backend (class-validator)
```typescript
export class CreateTicketDto {
  @IsString()
  @Length(1, 100)
  customerName: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;
}
```

### Sanitización
- **XSS Prevention**: Escape de HTML/JavaScript
- **SQL Injection**: Prisma ORM con queries parametrizadas
- **CSRF Protection**: Tokens CSRF en formularios
- **Input Validation**: Validación estricta de tipos

### Headers de Seguridad

```typescript
// Security headers interceptor
response.setHeader('X-Content-Type-Options', 'nosniff');
response.setHeader('X-Frame-Options', 'DENY');
response.setHeader('X-XSS-Protection', '1; mode=block');
response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
response.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
```

## Rate Limiting y DDoS

### Estrategias de Rate Limiting

```typescript
// Configuración por tipo de endpoint
const rateLimits = {
  auth: { limit: 5, ttl: 60000 },      // 5 intentos por minuto
  api: { limit: 100, ttl: 60000 },     // 100 requests por minuto
  notifications: { limit: 10, ttl: 60000 } // 10 notificaciones por minuto
};
```

### Protección DDoS
- **CloudFlare**: Protección a nivel de CDN
- **IP Whitelisting**: Para APIs críticas
- **Geographic Blocking**: Bloqueo por región
- **Bot Detection**: Detección de tráfico automatizado

## Auditoría y Monitoreo

### Logging de Seguridad

```typescript
// Auditoría de operaciones sensibles
const auditEvent = {
  userId: user.id,
  action: `${method} ${url}`,
  ip: request.ip,
  userAgent: request.get('User-Agent'),
  timestamp: new Date(),
  organizationId: user.organizationId
};
```

#### Eventos Auditados
- Logins exitosos/fallidos
- Cambios de estado de tickets
- Movimientos de inventario
- Cambios de configuración
- Acceso a datos sensibles

### Monitoreo de Seguridad

#### Métricas Clave
- **Failed Login Attempts**: Intentos de login fallidos
- **Suspicious Activity**: Actividad inusual por usuario
- **API Abuse**: Uso excesivo de endpoints
- **Data Access**: Acceso a datos sensibles

#### Alertas Automáticas
```typescript
// Alertas por email/Slack
if (failedAttempts > 5) {
  await sendSecurityAlert({
    type: 'BRUTE_FORCE_ATTEMPT',
    userId: user.id,
    ip: request.ip,
    timestamp: new Date()
  });
}
```

## Backup y Recuperación

### Estrategia de Backup

#### Frecuencia
- **Base de Datos**: Backup diario automático
- **Archivos**: Backup semanal
- **Configuración**: Backup en cada cambio

#### Retención
- **Backups Diarios**: 30 días
- **Backups Semanales**: 12 semanas
- **Backups Mensuales**: 12 meses

#### Testing
- **Restore Tests**: Mensuales
- **DR Drills**: Trimestrales
- **RTO/RPO**: 4 horas / 1 hora

### Plan de Recuperación ante Desastres

#### Escenarios Cubiertos
1. **Pérdida de Base de Datos**: Restore desde backup
2. **Fallo de Servidor**: Failover automático
3. **Ataque de Seguridad**: Aislamiento y recuperación
4. **Pérdida de Datos**: Restore desde backup más reciente

## Cumplimiento y Regulaciones

### GDPR (General Data Protection Regulation)

#### Derechos del Usuario
- **Right to Access**: Acceso a datos personales
- **Right to Rectification**: Corrección de datos
- **Right to Erasure**: Eliminación de datos
- **Right to Portability**: Exportación de datos

#### Implementación
```typescript
// Endpoint para exportar datos del usuario
@Get('export-data')
async exportUserData(@CurrentUser() user: AuthUser) {
  return this.userService.exportUserData(user.id);
}
```

### SOC 2 Type II

#### Controles Implementados
- **CC6.1**: Logical and Physical Access Controls
- **CC6.2**: System Access Controls
- **CC6.3**: Data Transmission and Disposal
- **CC6.6**: Vulnerability Management

## Incident Response

### Proceso de Respuesta

#### 1. Detección
- Monitoreo automático
- Reportes de usuarios
- Alertas de terceros

#### 2. Análisis
- Clasificación del incidente
- Evaluación de impacto
- Identificación de causa raíz

#### 3. Contención
- Aislamiento de sistemas afectados
- Bloqueo de accesos sospechosos
- Preservación de evidencia

#### 4. Erradicación
- Eliminación de amenazas
- Parcheo de vulnerabilidades
- Limpieza de sistemas

#### 5. Recuperación
- Restauración de servicios
- Verificación de integridad
- Monitoreo continuo

#### 6. Lecciones Aprendidas
- Post-mortem analysis
- Actualización de procedimientos
- Mejoras de seguridad

### Contactos de Emergencia

- **Security Team**: security@celhm.com
- **DevOps Team**: devops@celhm.com
- **Legal Team**: legal@celhm.com

## Training y Concienciación

### Programas de Training

#### Para Desarrolladores
- Secure coding practices
- OWASP Top 10
- Dependency management
- Code review security

#### Para Usuarios
- Password security
- Phishing awareness
- Data handling
- Incident reporting

### Concienciación Continua
- **Security Newsletters**: Mensuales
- **Security Updates**: Semanales
- **Training Sessions**: Trimestrales
- **Security Assessments**: Anuales

## Revisiones y Actualizaciones

### Frecuencia de Revisiones
- **Política de Seguridad**: Anual
- **Controles de Seguridad**: Semestral
- **Risk Assessment**: Trimestral
- **Vulnerability Assessment**: Mensual

### Proceso de Actualización
1. **Identificación**: Nuevas amenazas o regulaciones
2. **Evaluación**: Impacto y prioridad
3. **Implementación**: Cambios necesarios
4. **Testing**: Verificación de controles
5. **Documentación**: Actualización de políticas
6. **Training**: Capacitación del equipo

---

**Última actualización**: Diciembre 2024  
**Próxima revisión**: Diciembre 2025  
**Responsable**: Security Team


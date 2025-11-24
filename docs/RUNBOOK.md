# Runbook - CELHM

Guía operacional para el mantenimiento, monitoreo y resolución de problemas del sistema CELHM.

## Tabla de Contenidos

- [Monitoreo](#monitoreo)
- [Alertas](#alertas)
- [Procedimientos de Mantenimiento](#procedimientos-de-mantenimiento)
- [Resolución de Problemas](#resolución-de-problemas)
- [Backup y Recuperación](#backup-y-recuperación)
- [Escalabilidad](#escalabilidad)
- [Seguridad](#seguridad)

## Monitoreo

### Métricas Clave

#### Aplicación
- **Response Time**: < 500ms (P95)
- **Error Rate**: < 1%
- **Throughput**: Requests por segundo
- **Memory Usage**: < 80%
- **CPU Usage**: < 70%

#### Base de Datos
- **Connection Pool**: < 80% utilizado
- **Query Performance**: < 100ms promedio
- **Disk Usage**: < 85%
- **Replication Lag**: < 1 segundo

#### Infraestructura
- **Uptime**: > 99.9%
- **SSL Certificate**: Expiración > 30 días
- **DNS Resolution**: < 100ms
- **CDN Cache Hit Rate**: > 90%

### Herramientas de Monitoreo

#### Aplicación
```bash
# Health check
curl https://api.celhm.com/health

# Métricas de performance
curl https://api.celhm.com/metrics
```

#### Base de Datos
```sql
-- Conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Queries lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Tamaño de base de datos
SELECT pg_size_pretty(pg_database_size('celhm'));
```

#### Logs
```bash
# Logs de aplicación
tail -f /var/log/celhm/app.log

# Logs de errores
grep "ERROR" /var/log/celhm/app.log

# Logs de seguridad
grep "SECURITY" /var/log/celhm/security.log
```

## Alertas

### Configuración de Alertas

#### Críticas (P0)
- **Sistema caído**: Response time > 5s o error rate > 10%
- **Base de datos no disponible**: Connection timeout
- **Seguridad comprometida**: Múltiples login fallidos
- **Disco lleno**: > 95% utilizado

#### Altas (P1)
- **Performance degradado**: Response time > 2s
- **Error rate elevado**: > 5%
- **Memoria alta**: > 90% utilizado
- **Certificado SSL**: Expira en < 7 días

#### Medias (P2)
- **Stock bajo**: Productos bajo mínimo
- **Backup fallido**: Último backup > 24h
- **Logs de error**: > 100 errores por hora
- **CPU alto**: > 80% por > 10 minutos

### Canales de Notificación

#### Slack
```bash
# Canal de alertas críticas
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 CRITICAL: Database connection failed"}' \
  https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

#### Email
```bash
# Notificación por email
echo "Critical alert: System down" | mail -s "CELHM Alert" admin@celhm.com
```

#### SMS (Twilio)
```bash
# SMS de emergencia
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACxxx/Messages.json \
  -d "From=+1234567890" \
  -d "To=+0987654321" \
  -d "Body=CELHM Critical Alert: System Down"
```

## Procedimientos de Mantenimiento

### Mantenimiento Regular

#### Diario
- [ ] Verificar health checks
- [ ] Revisar logs de errores
- [ ] Verificar backups
- [ ] Monitorear métricas de performance

#### Semanal
- [ ] Revisar alertas de seguridad
- [ ] Verificar certificados SSL
- [ ] Limpiar logs antiguos
- [ ] Revisar uso de recursos

#### Mensual
- [ ] Actualizar dependencias
- [ ] Revisar políticas de seguridad
- [ ] Verificar procedimientos de backup
- [ ] Análisis de performance

#### Trimestral
- [ ] Auditoría de seguridad
- [ ] Revisión de capacidad
- [ ] Actualización de documentación
- [ ] Training del equipo

### Actualizaciones

#### Dependencias
```bash
# Actualizar dependencias
pnpm update

# Verificar vulnerabilidades
pnpm audit

# Actualizar dependencias críticas
pnpm update --latest
```

#### Base de Datos
```bash
# Backup antes de migración
pg_dump celhm > backup_$(date +%Y%m%d).sql

# Ejecutar migraciones
pnpm db:migrate

# Verificar integridad
pnpm db:seed --dry-run
```

#### Aplicación
```bash
# Deploy con zero-downtime
vercel --prod

# Verificar health después del deploy
curl https://api.celhm.com/health

# Rollback si es necesario
vercel rollback
```

## Resolución de Problemas

### Problemas Comunes

#### 1. Aplicación Lenta

**Síntomas**: Response time > 2s, timeouts
**Diagnóstico**:
```bash
# Verificar CPU y memoria
top
htop

# Verificar conexiones de base de datos
SELECT count(*) FROM pg_stat_activity;

# Verificar queries lentas
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;
```

**Soluciones**:
- Reiniciar aplicación
- Optimizar queries lentas
- Escalar recursos
- Limpiar cache

#### 2. Errores 500

**Síntomas**: Error rate > 5%, logs de error
**Diagnóstico**:
```bash
# Revisar logs de error
tail -f /var/log/celhm/error.log

# Verificar base de datos
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Verificar memoria
free -h
```

**Soluciones**:
- Revisar logs para identificar causa
- Reiniciar servicios
- Verificar conectividad de BD
- Escalar recursos si es necesario

#### 3. Base de Datos Lenta

**Síntomas**: Queries > 1s, timeouts de conexión
**Diagnóstico**:
```sql
-- Verificar conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Verificar locks
SELECT * FROM pg_locks WHERE NOT granted;

-- Verificar queries lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

**Soluciones**:
- Terminar queries largas
- Agregar índices
- Optimizar queries
- Escalar base de datos

#### 4. Problemas de Autenticación

**Síntomas**: Login fallidos, tokens inválidos
**Diagnóstico**:
```bash
# Verificar logs de auth
grep "AUTH" /var/log/celhm/security.log

# Verificar configuración de JWT
echo $JWT_SECRET

# Verificar Supabase
curl -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  https://api.supabase.co/v1/projects
```

**Soluciones**:
- Verificar configuración de JWT
- Revisar credenciales de Supabase
- Limpiar cache de tokens
- Verificar rate limiting

### Escalación

#### Nivel 1 - Desarrollador
- Problemas de aplicación
- Errores de código
- Configuración básica

#### Nivel 2 - DevOps
- Problemas de infraestructura
- Base de datos
- Networking
- Deployments

#### Nivel 3 - Arquitecto
- Problemas de arquitectura
- Decisiones técnicas
- Escalabilidad
- Seguridad

## Backup y Recuperación

### Estrategia de Backup

#### Base de Datos
```bash
# Backup diario automático
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME > backup_$(date +%Y%m%d).sql

# Backup incremental
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME --schema-only > schema_$(date +%Y%m%d).sql
```

#### Archivos
```bash
# Backup de uploads
tar -czf uploads_$(date +%Y%m%d).tar.gz /var/www/uploads/

# Backup de configuración
tar -czf config_$(date +%Y%m%d).tar.gz /etc/celhm/
```

#### Código
```bash
# Backup de código
git bundle create celhm_$(date +%Y%m%d).bundle --all
```

### Procedimiento de Recuperación

#### Recuperación Completa
```bash
# 1. Detener aplicación
systemctl stop celhm

# 2. Restaurar base de datos
psql -h $DB_HOST -U $DB_USER -d $DB_NAME < backup_20241201.sql

# 3. Restaurar archivos
tar -xzf uploads_20241201.tar.gz -C /var/www/

# 4. Verificar integridad
pnpm db:seed --dry-run

# 5. Reiniciar aplicación
systemctl start celhm
```

#### Recuperación Parcial
```bash
# Restaurar solo una tabla
pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME -t users backup_20241201.sql

# Restaurar desde punto específico
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT pg_switch_wal();"
```

### Testing de Recuperación

#### Mensual
```bash
# Crear ambiente de testing
docker run -d --name test-db postgres:15

# Restaurar backup
psql -h localhost -U postgres -d test_db < backup_20241201.sql

# Verificar datos
psql -h localhost -U postgres -d test_db -c "SELECT count(*) FROM users;"

# Limpiar
docker rm -f test-db
```

## Escalabilidad

### Indicadores de Escalabilidad

#### Aplicación
- **CPU**: > 70% por > 10 minutos
- **Memoria**: > 80% utilizado
- **Response Time**: > 1s promedio
- **Error Rate**: > 2%

#### Base de Datos
- **Connections**: > 80% del pool
- **Query Time**: > 500ms promedio
- **Disk I/O**: > 80% utilizado
- **Replication Lag**: > 5 segundos

### Estrategias de Escalado

#### Horizontal (Aplicación)
```bash
# Escalar instancias
vercel scale --instances 3

# Load balancer
nginx -s reload
```

#### Vertical (Base de Datos)
```sql
-- Aumentar conexiones
ALTER SYSTEM SET max_connections = 200;

-- Aumentar memoria
ALTER SYSTEM SET shared_buffers = '256MB';

-- Reiniciar para aplicar cambios
SELECT pg_reload_conf();
```

#### Caching
```bash
# Redis para cache
redis-cli FLUSHALL

# CDN para assets
curl -X PURGE https://cdn.celhm.com/assets/*
```

## Seguridad

### Monitoreo de Seguridad

#### Logs de Seguridad
```bash
# Intentos de login fallidos
grep "LOGIN_FAILED" /var/log/celhm/security.log

# Actividad sospechosa
grep "SUSPICIOUS" /var/log/celhm/security.log

# Accesos no autorizados
grep "UNAUTHORIZED" /var/log/celhm/security.log
```

#### Vulnerabilidades
```bash
# Scan de dependencias
pnpm audit

# Scan de código
npm audit

# Verificar certificados
openssl s_client -connect api.celhm.com:443 -servername api.celhm.com
```

### Respuesta a Incidentes

#### Procedimiento
1. **Identificar**: Tipo y alcance del incidente
2. **Contener**: Aislar sistemas afectados
3. **Eradicar**: Eliminar amenaza
4. **Recuperar**: Restaurar servicios
5. **Aprender**: Post-mortem y mejoras

#### Contactos de Emergencia
- **Security Team**: security@celhm.com
- **On-call Engineer**: +1-555-0123
- **Management**: management@celhm.com

### Actualizaciones de Seguridad

#### Dependencias
```bash
# Actualizar dependencias críticas
pnpm update --latest

# Verificar vulnerabilidades
pnpm audit --audit-level high
```

#### Sistema
```bash
# Actualizar sistema
apt update && apt upgrade

# Reiniciar servicios
systemctl restart celhm
```

## Contactos y Escalación

### Equipo de Operaciones
- **Lead DevOps**: devops-lead@celhm.com
- **Senior Engineer**: senior@celhm.com
- **On-call**: +1-555-0123

### Horarios de Soporte
- **Lunes-Viernes**: 9:00-18:00 (Horario local)
- **Emergencias**: 24/7
- **Mantenimiento**: Domingos 2:00-6:00

### Escalación
1. **Nivel 1**: Desarrollador (0-2 horas)
2. **Nivel 2**: Senior Engineer (2-4 horas)
3. **Nivel 3**: Lead DevOps (4-8 horas)
4. **Nivel 4**: Management (8+ horas)

---

**Última actualización**: Diciembre 2024  
**Próxima revisión**: Marzo 2025  
**Responsable**: DevOps Team


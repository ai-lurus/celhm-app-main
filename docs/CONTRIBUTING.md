# Guía de Contribución - CELHM

¡Gracias por tu interés en contribuir a CELHM! Esta guía te ayudará a entender cómo contribuir de manera efectiva al proyecto.

## Código de Conducta

Este proyecto sigue un código de conducta para asegurar un ambiente colaborativo y respetuoso. Al participar, te comprometes a mantener este código.

### Nuestros Estándares

- **Respeto**: Trata a todos con respeto y cortesía
- **Inclusión**: Bienvenidas todas las perspectivas y experiencias
- **Colaboración**: Trabaja juntos para el beneficio del proyecto
- **Constructividad**: Proporciona feedback constructivo y útil

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
git clone https://github.com/your-org/celhm-app.git
cd celhm-app

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp env.example .env.local
# Editar .env.local con tus configuraciones

# Ejecutar en modo desarrollo
pnpm dev
```

### 2. Flujo de Trabajo

#### Branches
- `main`: Código de producción
- `develop`: Código de desarrollo
- `feature/*`: Nuevas funcionalidades
- `bugfix/*`: Correcciones de bugs
- `hotfix/*`: Correcciones urgentes

#### Convenciones de Naming
```bash
# Features
feature/user-authentication
feature/inventory-management
feature/notification-system

# Bug fixes
bugfix/login-validation
bugfix/stock-calculation

# Hotfixes
hotfix/security-vulnerability
hotfix/critical-bug
```

### 3. Proceso de Desarrollo

#### 1. Crear una Branch
```bash
# Desde develop
git checkout develop
git pull origin develop
git checkout -b feature/nueva-funcionalidad
```

#### 2. Desarrollo
- Escribe código limpio y bien documentado
- Sigue las convenciones de código
- Escribe tests para tu código
- Actualiza documentación si es necesario

#### 3. Commit
```bash
# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: add user authentication system

- Implement JWT authentication
- Add login/logout functionality
- Add password validation
- Update API documentation"
```

#### 4. Push y Pull Request
```bash
# Push a tu branch
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
```

## Convenciones de Código

### TypeScript

#### Naming Conventions
```typescript
// Variables y funciones: camelCase
const userName = 'john';
function getUserData() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces: PascalCase
interface UserData {
  id: number;
  name: string;
}

// Enums: PascalCase
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
```

#### Estructura de Archivos
```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI base
│   └── forms/          # Componentes de formularios
├── hooks/              # Custom hooks
├── lib/                # Utilidades y configuración
├── pages/              # Páginas de la aplicación
├── stores/             # Estado global (Zustand)
└── types/              # Definiciones de tipos
```

### React/Next.js

#### Componentes
```typescript
// Componente funcional con TypeScript
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

#### Hooks
```typescript
// Custom hook
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lógica de autenticación
  }, []);

  return { user, loading };
}
```

### NestJS

#### Estructura de Módulos
```typescript
// Module
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

// Controller
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  async findAll() {
    return this.usersService.findAll();
  }
}

// Service
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }
}
```

### Base de Datos

#### Migraciones
```typescript
// Migración de Prisma
export async function up(prisma: PrismaClient) {
  await prisma.$executeRaw`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
}

export async function down(prisma: PrismaClient) {
  await prisma.$executeRaw`DROP TABLE users;`;
}
```

#### Queries
```typescript
// Usar Prisma para queries seguras
const users = await prisma.user.findMany({
  where: {
    organizationId: user.organizationId, // Multi-tenant
    active: true,
  },
  include: {
    profile: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
});
```

## Testing

### Estrategia de Testing

#### Frontend (Jest + React Testing Library)
```typescript
// Test de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Backend (Jest + Supertest)
```typescript
// Test de endpoint
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200);
  });
});
```

#### E2E (Playwright)
```typescript
// Test de flujo completo
import { test, expect } from '@playwright/test';

test('user can login and view dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Cobertura de Tests
- **Unit Tests**: > 80% cobertura
- **Integration Tests**: Endpoints críticos
- **E2E Tests**: Flujos principales

## Documentación

### Código
```typescript
/**
 * Calcula el stock disponible para una variante
 * @param stock - Stock total
 * @param reserved - Stock reservado
 * @returns Stock disponible
 */
function calculateAvailableStock(stock: number, reserved: number): number {
  return Math.max(0, stock - reserved);
}
```

### API (Swagger)
```typescript
@ApiOperation({ 
  summary: 'Create a new ticket',
  description: 'Creates a new repair ticket with customer information'
})
@ApiResponse({ 
  status: 201, 
  description: 'Ticket created successfully',
  type: Ticket
})
@ApiResponse({ 
  status: 400, 
  description: 'Invalid input data' 
})
@Post()
async createTicket(@Body() createTicketDto: CreateTicketDto) {
  // ...
}
```

### README
- Actualizar README.md para nuevas funcionalidades
- Incluir ejemplos de uso
- Documentar cambios breaking

## Pull Request Process

### Checklist Antes del PR
- [ ] Código sigue las convenciones
- [ ] Tests pasan localmente
- [ ] Documentación actualizada
- [ ] No hay console.logs o código de debug
- [ ] Variables de entorno documentadas
- [ ] Breaking changes documentados

### Template de PR
```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] Bug fix (cambio que corrige un issue)
- [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] Breaking change (fix o feature que causaría que funcionalidad existente no funcione como se espera)
- [ ] Documentación (cambios solo en documentación)

## Cómo probar
Pasos para probar los cambios:
1. Paso 1
2. Paso 2
3. Paso 3

## Screenshots (si aplica)
Agregar screenshots para cambios de UI.

## Checklist
- [ ] Mi código sigue las convenciones del proyecto
- [ ] He realizado self-review de mi código
- [ ] He comentado mi código, particularmente en áreas difíciles de entender
- [ ] He hecho cambios correspondientes a la documentación
- [ ] Mis cambios no generan warnings
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Tests unitarios nuevos y existentes pasan localmente
```

### Review Process
1. **Automated Checks**: CI/CD pipeline
2. **Code Review**: Al menos 1 reviewer
3. **Testing**: Verificar funcionalidad
4. **Approval**: Merge después de aprobación

## Herramientas y Configuración

### VS Code Extensions
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### Git Hooks
```bash
# Pre-commit hook
#!/bin/sh
pnpm lint
pnpm typecheck
pnpm test
```

### Scripts Útiles
```bash
# Desarrollo
pnpm dev              # Ejecutar en desarrollo
pnpm build            # Build de producción
pnpm test             # Ejecutar tests
pnpm lint             # Linting
pnpm typecheck        # Type checking

# Base de datos
pnpm db:migrate       # Ejecutar migraciones
pnpm db:seed          # Poblar base de datos
pnpm db:studio        # Prisma Studio

# Utilidades
pnpm clean            # Limpiar build
pnpm format           # Formatear código
```

## Recursos Adicionales

### Documentación
- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Comunidad
- [Discord](https://discord.gg/celhm)
- [GitHub Discussions](https://github.com/your-org/celhm-app/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/celhm)

### Learning Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Testing Best Practices](https://testing-library.com/docs/)

---

¡Gracias por contribuir a CELHM! Tu participación hace que este proyecto sea mejor para todos.


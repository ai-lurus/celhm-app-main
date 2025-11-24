import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser } from './auth.service';

@Injectable()
export class MockAuthService {
  private mockUsers: AuthUser[] = [
    {
      id: 1,
      email: 'direccion@acme-repair.com',
      name: 'Juan Pérez',
      role: Role.DIRECCION,
      organizationId: 1,
      branchId: 1,
    },
    {
      id: 2,
      email: 'admon@acme-repair.com',
      name: 'María García',
      role: Role.ADMON,
      organizationId: 1,
      branchId: 1,
    },
    {
      id: 3,
      email: 'laboratorio@acme-repair.com',
      name: 'Carlos López',
      role: Role.LABORATORIO,
      organizationId: 1,
      branchId: 1,
    },
  ];

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    // Mock validation - accept any password for demo users
    const user = this.mockUsers.find(u => u.email === email);
    if (user && password === 'ChangeMe123!') {
      return user;
    }
    return null;
  }

  getMockUsers(): AuthUser[] {
    return this.mockUsers;
  }
}


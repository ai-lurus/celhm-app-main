import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma/prisma.service';
import { Role } from '@prisma/client';
import { MockAuthService } from './mock-auth.service';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  organizationId: number;
  branchId?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mockAuthService: MockAuthService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthUser | null> {
    // Check if mocks are enabled
    if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true') {
      return this.mockAuthService.validateUser(email, password);
    }

    // TODO: Implement Supabase Auth validation
    // For now, return null to indicate no real auth
    return null;
  }

  async login(user: AuthUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      branchId: user.branchId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async validateJwtPayload(payload: any): Promise<AuthUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          memberships: {
            where: { organizationId: payload.organizationId },
            include: { organization: true },
          },
          branch: true,
        },
      });

      if (!user || !user.memberships.length) {
        return null;
      }

      const membership = user.memberships[0];

      return {
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        role: membership.role,
        organizationId: membership.organizationId,
        branchId: user.branchId || undefined,
      };
    } catch (error) {
      return null;
    }
  }

  async getCurrentUser(userId: number, organizationId: number): Promise<AuthUser | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            where: { organizationId },
            include: { organization: true },
          },
          branch: true,
        },
      });

      if (!user || !user.memberships.length) {
        return null;
      }

      const membership = user.memberships[0];

      return {
        id: user.id,
        email: user.email || '',
        name: user.name || '',
        role: membership.role,
        organizationId: membership.organizationId,
        branchId: user.branchId || undefined,
      };
    } catch (error) {
      return null;
    }
  }
}


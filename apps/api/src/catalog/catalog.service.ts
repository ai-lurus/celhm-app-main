import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        variants: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            variants: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getVariants(filters?: { marca?: string; modelo?: string }) {
    const where: any = {};
    
    if (filters?.marca) {
      where.brand = { contains: filters.marca, mode: 'insensitive' };
    }
    
    if (filters?.modelo) {
      where.model = { contains: filters.modelo, mode: 'insensitive' };
    }

    return this.prisma.variant.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getVariantById(id: number) {
    return this.prisma.variant.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });
  }
}


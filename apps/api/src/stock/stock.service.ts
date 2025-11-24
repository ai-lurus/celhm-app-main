import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUser } from '../auth/auth.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getStock(branchId: number, organizationId: number) {
    return this.prisma.stock.findMany({
      where: { 
        branch: {
          id: branchId,
          organizationId,
        },
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                brand: true,
                model: true,
              },
            },
          },
        },
      },
      orderBy: {
        variant: {
          product: { name: 'asc' },
        },
      },
    });
  }

  async updateStockMin(branchId: number, variantId: number, min: number, organizationId: number) {
    return this.prisma.stock.updateMany({
      where: {
        branchId,
        variantId,
        branch: {
          organizationId,
        },
      },
      data: { min },
    });
  }

  async getLowStockAlerts(organizationId: number) {
    return this.prisma.stock.findMany({
      where: {
        branch: { organizationId },
        qty: {
          lte: this.prisma.stock.fields.min,
        },
      },
      include: {
        variant: {
          include: {
            product: {
              select: {
                name: true,
                brand: true,
                model: true,
              },
            },
          },
        },
        branch: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async reserveStock(branchId: number, variantId: number, qty: number, organizationId: number) {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findFirst({
        where: {
          branchId,
          variantId,
          branch: { organizationId },
        },
      });

      if (!stock) {
        throw new Error('Stock not found');
      }

      const availableQty = stock.qty - stock.reserved;
      if (availableQty < qty) {
        throw new Error('Insufficient stock available');
      }

      return tx.stock.update({
        where: { id: stock.id },
        data: {
          reserved: stock.reserved + qty,
        },
      });
    });
  }

  async releaseStock(branchId: number, variantId: number, qty: number, organizationId: number) {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findFirst({
        where: {
          branchId,
          variantId,
          branch: { organizationId },
        },
      });

      if (!stock) {
        throw new Error('Stock not found');
      }

      const newReserved = Math.max(0, stock.reserved - qty);

      return tx.stock.update({
        where: { id: stock.id },
        data: {
          reserved: newReserved,
        },
      });
    });
  }

  async consumeStock(branchId: number, variantId: number, qty: number, organizationId: number) {
    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.stock.findFirst({
        where: {
          branchId,
          variantId,
          branch: { organizationId },
        },
      });

      if (!stock) {
        throw new Error('Stock not found');
      }

      if (stock.reserved < qty) {
        throw new Error('Insufficient reserved stock');
      }

      return tx.stock.update({
        where: { id: stock.id },
        data: {
          qty: stock.qty - qty,
          reserved: stock.reserved - qty,
        },
      });
    });
  }
}


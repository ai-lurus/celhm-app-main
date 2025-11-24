import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { MovementType } from '@prisma/client';
import { AuthUser } from '../auth/auth.service';
import { FoliosService } from '../folios/folios.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class MovementsService {
  constructor(
    private prisma: PrismaService,
    private foliosService: FoliosService,
  ) {}

  async createMovement(createMovementDto: CreateMovementDto, user: AuthUser, ip?: string, userAgent?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Generate folio if not provided
      let folio = createMovementDto.folio;
      if (!folio) {
        const prefix = this.getPrefixForMovementType(createMovementDto.type);
        folio = await this.foliosService.next(prefix, createMovementDto.branchId);
      }

      // Create movement
      const movement = await tx.movement.create({
        data: {
          ...createMovementDto,
          folio,
          userId: user.id,
          ip,
          userAgent,
        },
      });

      // Update stock based on movement type
      if (createMovementDto.type === MovementType.ING) {
        // Increase stock
        await tx.stock.upsert({
          where: {
            branchId_variantId: {
              branchId: createMovementDto.branchId,
              variantId: createMovementDto.variantId,
            },
          },
          update: {
            qty: {
              increment: createMovementDto.qty,
            },
          },
          create: {
            branchId: createMovementDto.branchId,
            variantId: createMovementDto.variantId,
            qty: createMovementDto.qty,
            min: 0,
            max: 1000,
            reserved: 0,
          },
        });
      } else if (createMovementDto.type === MovementType.EGR || createMovementDto.type === MovementType.VTA) {
        // Decrease stock
        const stock = await tx.stock.findFirst({
          where: {
            branchId: createMovementDto.branchId,
            variantId: createMovementDto.variantId,
          },
        });

        if (!stock || stock.qty < createMovementDto.qty) {
          throw new Error('Insufficient stock');
        }

        await tx.stock.update({
          where: { id: stock.id },
          data: {
            qty: stock.qty - createMovementDto.qty,
          },
        });
      }

      return movement;
    });
  }

  async getMovements(branchId: number, organizationId: number, page = 1, pageSize = 50) {
    const skip = (page - 1) * pageSize;

    const [movements, total] = await Promise.all([
      this.prisma.movement.findMany({
        where: {
          branchId,
          branch: { organizationId },
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
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.movement.count({
        where: {
          branchId,
          branch: { organizationId },
        },
      }),
    ]);

    return {
      data: movements,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  private getPrefixForMovementType(type: MovementType): string {
    switch (type) {
      case MovementType.ING:
        return 'ING';
      case MovementType.EGR:
        return 'EGR';
      case MovementType.VTA:
        return 'VTA';
      case MovementType.AJU:
        return 'AJU';
      case MovementType.TRF_OUT:
        return 'TRF_OUT';
      case MovementType.TRF_IN:
        return 'TRF_IN';
      default:
        return 'MOV';
    }
  }
}


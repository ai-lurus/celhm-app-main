import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateMovementDto {
  @ApiProperty()
  @IsInt()
  branchId: number;

  @ApiProperty()
  @IsInt()
  variantId: number;

  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty()
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  folio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  ticketId?: number;
}


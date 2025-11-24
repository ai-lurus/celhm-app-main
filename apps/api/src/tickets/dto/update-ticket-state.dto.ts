import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDecimal } from 'class-validator';
import { TicketState } from '@prisma/client';

export class UpdateTicketStateDto {
  @ApiProperty({ enum: TicketState })
  @IsEnum(TicketState)
  state: TicketState;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  solution?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDecimal()
  estimatedCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDecimal()
  finalCost?: number;
}


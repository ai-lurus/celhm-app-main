import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@ApiTags('movements')
@Controller('movements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MovementsController {
  constructor(private movementsService: MovementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create movement' })
  @ApiResponse({ status: 201, description: 'Movement created' })
  async createMovement(
    @Body() createMovementDto: CreateMovementDto,
    @CurrentUser() user: AuthUser,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    return this.movementsService.createMovement(createMovementDto, user, ip, userAgent);
  }

  @Get()
  @ApiOperation({ summary: 'Get movements' })
  @ApiResponse({ status: 200, description: 'Movements list' })
  async getMovements(
    @Query('sucursal') sucursal: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
    @CurrentUser() user: AuthUser,
  ) {
    const branchId = parseInt(sucursal) || user.branchId || 1;
    return this.movementsService.getMovements(
      branchId,
      user.organizationId,
      parseInt(page),
      parseInt(pageSize),
    );
  }
}


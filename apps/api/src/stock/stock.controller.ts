import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { StockService } from './stock.service';
import { UpdateStockMinDto } from './dto/update-stock-min.dto';

@ApiTags('stock')
@Controller('stock')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Get stock by branch' })
  @ApiResponse({ status: 200, description: 'Stock list' })
  async getStock(
    @Query('sucursal') sucursal: string,
    @CurrentUser() user: AuthUser,
  ) {
    const branchId = parseInt(sucursal) || user.branchId || 1;
    return this.stockService.getStock(branchId, user.organizationId);
  }

  @Patch('min')
  @ApiOperation({ summary: 'Update stock minimum' })
  @ApiResponse({ status: 200, description: 'Stock minimum updated' })
  async updateStockMin(
    @Body() updateStockMinDto: UpdateStockMinDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.stockService.updateStockMin(
      updateStockMinDto.branchId,
      updateStockMinDto.variantId,
      updateStockMinDto.min,
      user.organizationId,
    );
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiResponse({ status: 200, description: 'Low stock alerts' })
  async getLowStockAlerts(@CurrentUser() user: AuthUser) {
    return this.stockService.getLowStockAlerts(user.organizationId);
  }
}


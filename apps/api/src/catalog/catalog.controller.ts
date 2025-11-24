import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  @Get('products')
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Products list' })
  async getProducts() {
    return this.catalogService.getProducts();
  }

  @Get('variants')
  @ApiOperation({ summary: 'Get variants with filters' })
  @ApiResponse({ status: 200, description: 'Variants list' })
  async getVariants(
    @Query('marca') marca?: string,
    @Query('modelo') modelo?: string,
  ) {
    return this.catalogService.getVariants({ marca, modelo });
  }

  @Get('variants/:id')
  @ApiOperation({ summary: 'Get variant by ID' })
  @ApiResponse({ status: 200, description: 'Variant details' })
  async getVariantById(@Param('id') id: string) {
    return this.catalogService.getVariantById(parseInt(id));
  }
}


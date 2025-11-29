import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketState } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStateDto } from './dto/update-ticket-state.dto';
import { AddTicketPartDto } from './dto/add-ticket-part.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async createTicket(
    @Body() createTicketDto: CreateTicketDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.createTicket(createTicketDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get tickets' })
  @ApiResponse({ status: 200, description: 'Tickets list' })
  @ApiQuery({ name: 'estado', required: false, enum: TicketState })
  @ApiQuery({ name: 'q', required: false, description: 'Search by folio, customer or device' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'pageSize', required: false, description: 'Items per page' })
  async getTickets(
    @CurrentUser() user: AuthUser,
    @Query('estado') estado?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const branchId = user.branchId || 1;
    return this.ticketsService.getTickets(branchId, user.organizationId, {
      estado: estado as any,
      q,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  async getTicketById(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.getTicketById(parseInt(id), user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  async updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.updateTicket(parseInt(id), updateTicketDto, user);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Update ticket state' })
  @ApiResponse({ status: 200, description: 'Ticket state updated' })
  async updateTicketState(
    @Param('id') id: string,
    @Body() updateTicketStateDto: UpdateTicketStateDto,
    @CurrentUser() user: AuthUser,
    @Req() req: any,
  ) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    return this.ticketsService.updateTicketState(
      parseInt(id),
      updateTicketStateDto,
      user,
      ip,
      userAgent,
    );
  }

  @Post(':id/piezas')
  @ApiOperation({ summary: 'Add part to ticket' })
  @ApiResponse({ status: 201, description: 'Part added to ticket' })
  async addTicketPart(
    @Param('id') id: string,
    @Body() addTicketPartDto: AddTicketPartDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.ticketsService.addTicketPart(parseInt(id), addTicketPartDto, user);
  }
}


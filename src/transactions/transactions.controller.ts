import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmDeliveryDto, OpenDisputeDto, ResolveDisputeDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  /**
   * POST /transactions
   * Comprador registra la tx después de fondear el escrow on-chain.
   */
  @Post()
  create(
    @Body() dto: CreateTransactionDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.create(dto, user.userId);
  }

  /**
   * GET /transactions/mine
   * Mis transacciones (como comprador o vendedor).
   */
  @Get('mine')
  findMine(@CurrentUser() user: { userId: string }) {
    return this.service.findMine(user.userId);
  }

  /**
   * GET /transactions/:id
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.findOne(id, user.userId);
  }

  /**
   * PATCH /transactions/:id/confirm
   * Comprador confirma la entrega → libera fondos + transfiere NFT.
   */
  @Patch(':id/confirm')
  confirmDelivery(
    @Param('id') id: string,
    @Body() dto: ConfirmDeliveryDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.confirmDelivery(id, dto, user.userId);
  }

  /**
   * PATCH /transactions/:id/dispute
   * Comprador abre una disputa.
   */
  @Patch(':id/dispute')
  openDispute(
    @Param('id') id: string,
    @Body() dto: OpenDisputeDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.service.openDispute(id, dto, user.userId);
  }

  /**
   * PATCH /transactions/:id/resolve
   * Admin resuelve la disputa (llamar solo desde el panel de administración).
   */
  @Patch(':id/resolve')
  resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.service.resolveDispute(id, dto);
  }
}

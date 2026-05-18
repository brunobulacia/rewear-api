import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('transactions')
  getTransactions() {
    return this.service.getTransactions();
  }

  @Get('disputes')
  getDisputes() {
    return this.service.getDisputes();
  }

  @Patch('disputes/:transactionId/resolve')
  resolveDispute(
    @Param('transactionId') transactionId: string,
    @Body() body: { buyerWins: boolean },
  ) {
    return this.service.resolveDispute(transactionId, body.buyerWins);
  }
}

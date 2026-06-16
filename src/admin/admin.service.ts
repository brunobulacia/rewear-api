import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactions: TransactionsService,
  ) {}

  async getStats() {
    const [
      totalUsers,
      totalGarments,
      verifiedGarments,
      activeTransactions,
      completedTransactions,
      openDisputes,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.garment.count(),
      this.prisma.garment.count({ where: { estado: 'VERIFIED' } }),
      this.prisma.transaction.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      totalUsers,
      totalGarments,
      verifiedGarments,
      activeTransactions,
      completedTransactions,
      openDisputes,
    };
  }

  async getTransactions(limit = 20) {
    const txs = await this.prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        garment: { select: { id: true, titulo: true, imagenes: true, precio: true } },
        buyer:   { select: { id: true, walletAddress: true, nombre: true } },
        seller:  { select: { id: true, walletAddress: true, nombre: true } },
        disputes: { select: { id: true, reason: true, status: true } },
      },
    });
    // Alinear con la forma que espera el frontend (amount → amountMatic)
    return txs.map(({ amount, ...tx }) => ({ ...tx, amountMatic: amount }));
  }

  async getDisputes() {
    return this.prisma.dispute.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: {
          include: {
            garment: { select: { id: true, titulo: true, imagenes: true } },
            buyer:   { select: { id: true, walletAddress: true, nombre: true } },
            seller:  { select: { id: true, walletAddress: true, nombre: true } },
          },
        },
      },
    });
  }

  async resolveDispute(transactionId: string, buyerWins: boolean) {
    const dispute = await this.prisma.dispute.findFirst({ where: { transactionId } });
    if (!dispute) throw new Error('Disputa no encontrada');

    // Delega en TransactionsService, que ejecuta la resolución ON-CHAIN
    // (escrow.resolveDispute → libera o reembolsa el ETH real), transfiere el
    // NFT si gana el vendedor, y actualiza disputa/transacción/prenda en la DB.
    await this.transactions.resolveDispute(transactionId, { buyerWins });

    return { ok: true };
  }
}

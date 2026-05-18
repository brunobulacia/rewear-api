import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.transaction.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        garment: { select: { id: true, titulo: true, imagenes: true, precio: true } },
        buyer:   { select: { id: true, walletAddress: true, nombre: true } },
        seller:  { select: { id: true, walletAddress: true, nombre: true } },
        disputes: { select: { id: true, reason: true, status: true } },
      },
    });
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

    await this.prisma.dispute.updateMany({
      where: { transactionId },
      data: { status: 'RESOLVED', resolution: buyerWins ? 'Reembolso al comprador' : 'Fondos liberados al vendedor' },
    });

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: buyerWins ? 'REFUNDED' : 'COMPLETED' },
    });

    await this.prisma.garment.updateMany({
      where: { transactions: { some: { id: transactionId } } },
      data: { estado: buyerWins ? 'VERIFIED' : 'SOLD' },
    });

    return { ok: true };
  }
}

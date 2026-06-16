import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ConfirmDeliveryDto, OpenDisputeDto, ResolveDisputeDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private prisma: PrismaService,
    private blockchain: BlockchainService,
  ) {}

  /**
   * Registra una transacción después de que el comprador fundó el escrow on-chain.
   */
  async create(dto: CreateTransactionDto, buyerId: string) {
    const garment = await this.prisma.garment.findUnique({
      where: { id: dto.garmentId },
    });

    if (!garment) throw new NotFoundException('Prenda no encontrada');
    if (garment.estado !== 'VERIFIED') {
      throw new BadRequestException('La prenda no está verificada o ya fue vendida');
    }
    if (garment.sellerId === buyerId) {
      throw new BadRequestException('No podés comprar tu propia prenda');
    }

    // Prevenir doble compra
    const existing = await this.prisma.transaction.findFirst({
      where: { garmentId: dto.garmentId, status: { in: ['PENDING', 'CONFIRMED'] } },
    });
    if (existing) throw new BadRequestException('La prenda ya tiene una transacción activa');

    const transaction = await this.prisma.transaction.create({
      data: {
        buyerId,
        sellerId:     garment.sellerId,
        garmentId:    dto.garmentId,
        amount:       dto.amountMatic,
        escrowTxHash: dto.escrowTxHash,
        escrowTradeId: dto.escrowTradeId,
        status:       'CONFIRMED',
      },
      include: { buyer: true, seller: true, garment: true },
    });

    // Marcar prenda como no disponible mientras está en transacción
    await this.prisma.garment.update({
      where: { id: dto.garmentId },
      data: { estado: 'PENDING' },
    });

    this.logger.log(`Transacción creada: ${transaction.id} para prenda ${dto.garmentId}`);
    return transaction;
  }

  /**
   * Confirma la entrega: actualiza el estado y transfiere el NFT al comprador.
   */
  async confirmDelivery(transactionId: string, dto: ConfirmDeliveryDto, userId: string) {
    const tx = await this.getOrThrow(transactionId);

    if (tx.buyerId !== userId) throw new ForbiddenException('Solo el comprador puede confirmar');
    if (tx.status !== 'CONFIRMED') {
      throw new BadRequestException(`Estado inválido: ${tx.status}`);
    }

    // Actualizar DB
    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'COMPLETED', escrowTxHash: dto.txHash },
      include: { buyer: true, seller: true, garment: true },
    });

    // Marcar prenda como vendida
    await this.prisma.garment.update({
      where: { id: tx.garmentId },
      data: { estado: 'SOLD' },
    });

    // Transferir NFT al comprador (fire-and-forget, no bloquea la respuesta)
    const nftTokenId = tx.garment.nftTokenId;
    if (nftTokenId) {
      this.blockchain
        .transferPassport(tx.buyer.walletAddress, nftTokenId)
        .catch((err) => this.logger.error('Error transfiriendo NFT', err));
    }

    this.logger.log(`Entrega confirmada: tx ${transactionId}`);
    return updated;
  }

  /**
   * Abre una disputa.
   */
  async openDispute(transactionId: string, dto: OpenDisputeDto, userId: string) {
    const tx = await this.getOrThrow(transactionId);

    if (tx.buyerId !== userId) throw new ForbiddenException('Solo el comprador puede disputar');
    if (tx.status !== 'CONFIRMED') {
      throw new BadRequestException(`Estado inválido: ${tx.status}`);
    }

    // Crear registro de disputa
    await this.prisma.dispute.create({
      data: {
        transactionId,
        openedById: userId,
        reason: 'Disputa abierta por el comprador',
        status: 'OPEN',
      },
    });

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'DISPUTED' },
      include: { buyer: true, seller: true, garment: true },
    });

    this.logger.log(`Disputa abierta en tx ${transactionId}`);
    return updated;
  }

  /**
   * Resuelve una disputa (solo admin/plataforma).
   * Llama al contrato Escrow on-chain y actualiza la DB.
   */
  async resolveDispute(transactionId: string, dto: ResolveDisputeDto) {
    const tx = await this.getOrThrow(transactionId);

    if (tx.status !== 'DISPUTED') {
      throw new BadRequestException('La transacción no está en disputa');
    }

    // Resolver on-chain PRIMERO. Si falla (ej. el trade no está DISPUTED en la
    // blockchain), abortamos y NO tocamos la DB — así no quedan inconsistentes.
    if (tx.escrowTradeId) {
      const ok = await this.blockchain.resolveDispute(tx.escrowTradeId, dto.buyerWins);
      if (!ok) {
        throw new BadRequestException(
          'No se pudo resolver la disputa on-chain. La disputa debe estar abierta en el contrato (firmada por el comprador).',
        );
      }
    }

    const newStatus = dto.buyerWins ? 'REFUNDED' : 'COMPLETED';

    // Resolver disputa en DB
    await this.prisma.dispute.updateMany({
      where: { transactionId, status: 'OPEN' },
      data: {
        status: 'RESOLVED',
        resolution: dto.buyerWins ? 'Reembolso al comprador' : 'Fondos liberados al vendedor',
      },
    });

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status: newStatus },
      include: { buyer: true, seller: true, garment: true },
    });

    // Si gana el vendedor, marcar como vendida y transferir NFT
    if (!dto.buyerWins) {
      await this.prisma.garment.update({
        where: { id: tx.garmentId },
        data: { estado: 'SOLD' },
      });
      if (tx.garment.nftTokenId) {
        this.blockchain
          .transferPassport(tx.buyer.walletAddress, tx.garment.nftTokenId)
          .catch((err) => this.logger.error('Error transfiriendo NFT en resolución', err));
      }
    } else {
      // Reembolso: volver la prenda a disponible
      await this.prisma.garment.update({
        where: { id: tx.garmentId },
        data: { estado: 'VERIFIED' },
      });
    }

    this.logger.log(`Disputa resuelta en tx ${transactionId} — buyerWins: ${dto.buyerWins}`);
    return updated;
  }

  async findMine(userId: string) {
    const txs = await this.prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        garment: { select: { id: true, titulo: true, imagenes: true, precio: true, marca: true, talla: true } },
        buyer:   { select: { id: true, walletAddress: true, nombre: true } },
        seller:  { select: { id: true, walletAddress: true, nombre: true } },
        disputes: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return txs.map(({ amount, disputes, ...tx }) => ({
      ...tx,
      amountMatic: amount,
      dispute: disputes[0] ?? null,
    }));
  }

  async findOne(transactionId: string, userId: string) {
    const tx = await this.getOrThrow(transactionId);
    if (tx.buyerId !== userId && tx.sellerId !== userId) {
      throw new ForbiddenException('No tenés acceso a esta transacción');
    }
    return tx;
  }

  private async getOrThrow(transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        garment: true,
        buyer:   true,
        seller:  true,
        disputes: true,
      },
    });
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    return tx;
  }
}

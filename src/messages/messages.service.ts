import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async send(dto: SendMessageDto, fromUserId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      select: { buyerId: true, sellerId: true },
    });
    if (!tx) throw new NotFoundException('Transacción no encontrada');

    const isParticipant = tx.buyerId === fromUserId || tx.sellerId === fromUserId;
    if (!isParticipant) throw new ForbiddenException('No sos parte de esta transacción');

    const receiverId = tx.buyerId === fromUserId ? tx.sellerId : tx.buyerId;

    return this.prisma.message.create({
      data: {
        senderId: fromUserId,
        receiverId,
        transactionId: dto.transactionId,
        content: dto.content.trim(),
      },
      include: {
        sender: { select: { id: true, nombre: true, walletAddress: true } },
      },
    });
  }

  async getInbox(userId: string) {
    const txs = await this.prisma.transaction.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        garment: { select: { id: true, titulo: true, imagenes: true } },
        buyer:   { select: { id: true, nombre: true, walletAddress: true } },
        seller:  { select: { id: true, nombre: true, walletAddress: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, nombre: true, walletAddress: true } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return txs.map((tx) => ({
      transactionId: tx.id,
      garment:       tx.garment,
      otherUser:     tx.buyerId === userId ? tx.seller : tx.buyer,
      lastMessage:   tx.messages[0] ?? null,
    }));
  }

  async getByTransaction(transactionId: string, userId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { buyerId: true, sellerId: true },
    });
    if (!tx) throw new NotFoundException('Transacción no encontrada');

    const isParticipant = tx.buyerId === userId || tx.sellerId === userId;
    if (!isParticipant) throw new ForbiddenException('No sos parte de esta transacción');

    return this.prisma.message.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, nombre: true, walletAddress: true } },
      },
    });
  }
}

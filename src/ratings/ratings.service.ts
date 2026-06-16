import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';

export class CreateRatingDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score: number; // 1–5

  @IsOptional()
  @IsString()
  comment?: string;
}

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRatingDto, fromUserId: string) {
    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score debe ser entre 1 y 5');
    }

    const tx = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
      select: { buyerId: true, sellerId: true, status: true },
    });
    if (!tx) throw new NotFoundException('Transacción no encontrada');
    if (tx.buyerId !== fromUserId) throw new ForbiddenException('Solo el comprador puede calificar');
    if (tx.status !== 'COMPLETED') throw new BadRequestException('Solo se puede calificar transacciones completadas');

    const existing = await this.prisma.rating.findFirst({
      where: { transactionId: dto.transactionId, fromUserId },
    });
    if (existing) throw new BadRequestException('Ya calificaste esta transacción');

    return this.prisma.rating.create({
      data: {
        transactionId: dto.transactionId,
        fromUserId,
        toUserId: tx.sellerId,
        score: dto.score,
        comment: dto.comment,
      },
    });
  }

  async getByUser(userId: string) {
    const ratings = await this.prisma.rating.findMany({
      where: { toUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, nombre: true, walletAddress: true } },
        transaction: {
          include: {
            garment: { select: { id: true, titulo: true, imagenes: true } },
          },
        },
      },
    });

    const avg = ratings.length
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : null;

    return { ratings, avg, total: ratings.length };
  }

  async getByTransaction(transactionId: string) {
    return this.prisma.rating.findFirst({ where: { transactionId } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Reputación agregada de un vendedor: promedio de estrellas, nº de reseñas y ventas concretadas. */
  private async getReputation(userId: string) {
    const [agg, salesCount] = await Promise.all([
      this.prisma.rating.aggregate({
        where: { toUserId: userId },
        _avg: { score: true },
        _count: true,
      }),
      this.prisma.transaction.count({
        where: { sellerId: userId, status: 'COMPLETED' },
      }),
    ]);
    return {
      ratingAvg: agg._avg.score,   // null si no tiene reseñas
      ratingCount: agg._count,
      salesCount,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        email: true,
        ubicacion: true,
        avatar: true,
        rol: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        email: true,
        ubicacion: true,
        avatar: true,
        rol: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }

  async getPublicProfileById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        avatar: true,
        rol: true,
        createdAt: true,
        garments: {
          where: { estado: 'VERIFIED' },
          select: { id: true, titulo: true, precio: true, imagenes: true, marca: true, talla: true },
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { ...user, ...(await this.getReputation(user.id)) };
  }

  async getPublicProfile(walletAddress: string) {
    const user = await this.prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
      select: {
        id: true,
        walletAddress: true,
        nombre: true,
        avatar: true,
        rol: true,
        createdAt: true,
        garments: {
          where: { estado: 'VERIFIED' },
          select: {
            id: true,
            titulo: true,
            precio: true,
            imagenes: true,
            marca: true,
            talla: true,
          },
          take: 12,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return { ...user, ...(await this.getReputation(user.id)) };
  }
}

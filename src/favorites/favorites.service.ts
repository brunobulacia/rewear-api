import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Agrega o quita la prenda de favoritos. Devuelve el estado resultante. */
  async toggle(userId: string, garmentId: string): Promise<{ favorited: boolean }> {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_garmentId: { userId, garmentId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }
    await this.prisma.favorite.create({ data: { userId, garmentId } });
    return { favorited: true };
  }

  /** Prendas favoritas del usuario (las más recientes primero). */
  async findMine(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        garment: {
          include: {
            seller: { select: { id: true, nombre: true, walletAddress: true } },
            verification: { select: { wearLevel: true, authenticityPct: true } },
          },
        },
      },
    });
    return favs.map((f) => f.garment);
  }

  /** IDs de las prendas favoritas (para pintar el corazón en el catálogo). */
  async myIds(userId: string): Promise<string[]> {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      select: { garmentId: true },
    });
    return favs.map((f) => f.garmentId);
  }
}
